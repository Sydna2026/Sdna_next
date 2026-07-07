import Parser from "rss-parser";
import { prisma } from "./prisma";
import { sendArticlesEmail } from "./email";

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

  // Notify subscribers for each specialization that got new articles.
  const base = process.env.APP_URL || "https://sydan.org";
  for (const specId of touchedSpecs) {
    const articles = await prisma.article.findMany({
      where: { specializationId: specId, notifiedAt: null },
      orderBy: { publishedAt: "desc" },
    });
    if (articles.length === 0) continue;

    const specialization = await prisma.specialization.findUnique({ where: { id: specId } });
    if (!specialization) continue;

    const subscriptions = await prisma.subscription.findMany({
      where: { specializationId: specId, status: "active" },
      include: { subscriber: true },
    });

    for (const sub of subscriptions) {
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
          unsubscribeUrl: `${base}/api/unsubscribe?token=${sub.unsubToken}`,
        });
        summary.emailsSent++;
      } catch {
        // One bad recipient shouldn't abort the whole run.
      }
    }

    // Mark these articles as notified so we never email them twice, even if
    // there were zero subscribers (avoids a backlog blast on first subscribe).
    await prisma.article.updateMany({
      where: { id: { in: articles.map((a) => a.id) } },
      data: { notifiedAt: new Date() },
    });
    summary.perSpecialization[specialization.slug] = articles.length;
  }

  return summary;
}
