import Parser from "rss-parser";
import { prisma } from "./prisma";
import { sendArticlesEmail } from "./email";
import { isBlockedHost } from "./security";

const parser = new Parser({ timeout: 15000 });

export interface IngestSummary {
  feedsChecked: number;
  feedsFailed: number;
  newArticles: number;
  emailsSent: number;
  perSpecialization: Record<string, number>;
}

// Poll every active feed, store genuinely new articles (deduped by unique link),
// then email each specialization's active subscribers about the new articles.
export async function runIngestion(): Promise<IngestSummary> {
  const summary: IngestSummary = {
    feedsChecked: 0,
    feedsFailed: 0,
    newArticles: 0,
    emailsSent: 0,
    perSpecialization: {},
  };

  const resources = await prisma.resource.findMany({ where: { active: true } });
  const touchedSpecs = new Set<string>();

  for (const resource of resources) {
    summary.feedsChecked++;
    // SSRF guard: never fetch internal/loopback/link-local addresses.
    if (isBlockedHost(resource.feedUrl)) {
      summary.feedsFailed++;
      continue;
    }
    let feed: Parser.Output<Record<string, unknown>>;
    try {
      feed = await parser.parseURL(resource.feedUrl);
    } catch {
      summary.feedsFailed++;
      continue;
    }

    for (const item of feed.items ?? []) {
      const link = item.link?.trim();
      if (!link) continue;
      try {
        await prisma.article.create({
          data: {
            specializationId: resource.specializationId,
            resourceId: resource.id,
            title: (item.title ?? "Untitled").trim().slice(0, 500),
            link,
            publishedAt: item.isoDate ? new Date(item.isoDate) : null,
          },
        });
        summary.newArticles++;
        touchedSpecs.add(resource.specializationId);
      } catch {
        // Unique-constraint violation on `link` => we already have it. Skip.
      }
    }
  }

  // Notify each active subscriber, but only about articles PUBLISHED AFTER the
  // date they subscribed (confirmedAt), and never the same article twice
  // (lastNotifiedAt cursor). This gives new subscribers only forward-looking
  // updates — no back-catalog — exactly per requirement.
  const base = process.env.APP_URL || "https://sydan.org";
  const now = new Date();

  for (const specId of touchedSpecs) {
    const specialization = await prisma.specialization.findUnique({ where: { id: specId } });
    if (!specialization) continue;

    const subscriptions = await prisma.subscription.findMany({
      where: { specializationId: specId, status: "active" },
      include: { subscriber: true },
    });

    for (const sub of subscriptions) {
      const anchor = sub.confirmedAt ?? sub.createdAt; // "the date they subscribed"
      const since = sub.lastNotifiedAt ?? new Date(0); // avoid re-sending
      const articles = await prisma.article.findMany({
        where: {
          specializationId: specId,
          publishedAt: { gt: anchor },
          createdAt: { gt: since },
        },
        orderBy: { publishedAt: "desc" },
        take: 25,
      });
      if (articles.length === 0) continue;

      try {
        await sendArticlesEmail({
          to: sub.subscriber.email,
          name: sub.subscriber.name,
          specializationTitle: specialization.title,
          articles: articles.map((a) => ({
            title: a.title,
            link: a.link,
            publishedAt: a.publishedAt,
          })),
          unsubscribeUrl: `${base}/unsubscribe?token=${sub.unsubToken}`,
        });
        summary.emailsSent++;
        summary.perSpecialization[specialization.slug] =
          (summary.perSpecialization[specialization.slug] ?? 0) + articles.length;
      } catch {
        // One bad recipient shouldn't abort the whole run.
      }

      // Advance this subscriber's cursor so they aren't re-notified next run.
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { lastNotifiedAt: now },
      });
    }
  }

  return summary;
}
