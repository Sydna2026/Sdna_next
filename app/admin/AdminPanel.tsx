"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Spec {
  id: string;
  slug: string;
  title: string;
  feeds: number;
  articles: number;
  subscribersActive: number;
  subscribersTotal: number;
}
interface Resource {
  id: string;
  name: string;
  feedUrl: string;
  specialization: { slug: string; title: string };
}
interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  subscriptions: { specialization: string; slug: string; status: string }[];
}

export default function AdminPanel() {
  const router = useRouter();
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [tab, setTab] = useState<"feeds" | "subscribers">("feeds");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string>("");

  const handleAuthError = useCallback(
    (res: Response) => {
      if (res.status === 401) {
        router.push("/admin/login");
        return true;
      }
      return false;
    },
    [router],
  );

  const reload = useCallback(async () => {
    const [s, r, subs] = await Promise.all([
      fetch("/api/admin/specializations"),
      fetch("/api/admin/resources"),
      fetch("/api/admin/subscribers"),
    ]);
    if (handleAuthError(s)) return;
    const sj = await s.json();
    const rj = await r.json();
    const subsj = await subs.json();
    if (sj.ok) setSpecs(sj.specializations);
    if (rj.ok) setResources(rj.resources);
    if (subsj.ok) setSubscribers(subsj.subscribers);
  }, [handleAuthError]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addFeed(slug: string, name: string, feedUrl: string) {
    setBusy(true);
    setNotice("");
    const res = await fetch("/api/admin/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specializationSlug: slug, name, feedUrl }),
    });
    if (handleAuthError(res)) return;
    const data = await res.json();
    setBusy(false);
    if (!data.ok) {
      setNotice(data.error || "Could not add feed.");
      return;
    }
    await reload();
  }

  async function deleteFeed(id: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/resources?id=${id}`, { method: "DELETE" });
    if (handleAuthError(res)) return;
    setBusy(false);
    await reload();
  }

  async function runIngestion() {
    setBusy(true);
    setNotice("Running ingestion…");
    const res = await fetch("/api/admin/ingest", { method: "POST" });
    if (handleAuthError(res)) return;
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      const s = data.summary;
      setNotice(
        `Done: ${s.newArticles} new article(s), ${s.emailsSent} email(s) sent, ${s.feedsChecked} feed(s) checked${
          s.feedsFailed ? `, ${s.feedsFailed} failed` : ""
        }.`,
      );
      await reload();
    } else {
      setNotice(data.error || "Ingestion failed.");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const feedsFor = (slug: string) => resources.filter((r) => r.specialization.slug === slug);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 text-[#4A4A4A]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">Admin</h1>
        <div className="flex gap-3">
          <button
            onClick={runIngestion}
            disabled={busy}
            className="rounded-xl bg-[#A08C8A] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#8e7a78] disabled:opacity-60"
          >
            Run ingestion now
          </button>
          <button
            onClick={logout}
            className="rounded-xl border border-[#4A4A4A]/30 px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-black/5"
          >
            Log out
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-6 rounded-xl border border-[#A08C8A]/40 bg-[#F9ECE4] px-4 py-3 text-sm">
          {notice}
        </div>
      )}

      <div className="mb-6 flex gap-2">
        {(["feeds", "subscribers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${
              tab === t ? "bg-[#4A4A4A] text-white" : "bg-black/5 text-[#4A4A4A]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "feeds" && (
        <div className="space-y-4">
          {specs.map((spec) => (
            <div key={spec.id} className="rounded-2xl border border-[#E5D5CD] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold">{spec.title}</h3>
                  <p className="text-xs text-gray-500">
                    {spec.subscribersActive} active subscriber(s) · {spec.feeds} feed(s) ·{" "}
                    {spec.articles} article(s)
                  </p>
                </div>
                <span className="text-xs text-gray-400">{spec.slug}</span>
              </div>

              <ul className="mt-4 space-y-2">
                {feedsFor(spec.slug).map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-[#F9ECE4] px-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="font-semibold">{r.name}</span>{" "}
                      <a
                        href={r.feedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#A08C8A] break-all"
                      >
                        {r.feedUrl}
                      </a>
                    </span>
                    <button
                      onClick={() => deleteFeed(r.id)}
                      disabled={busy}
                      className="shrink-0 text-xs font-bold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
                {feedsFor(spec.slug).length === 0 && (
                  <li className="text-xs text-gray-400">No feeds yet.</li>
                )}
              </ul>

              <FeedAdder slug={spec.slug} busy={busy} onAdd={addFeed} />
            </div>
          ))}
        </div>
      )}

      {tab === "subscribers" && (
        <div className="overflow-x-auto rounded-2xl border border-[#E5D5CD] bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F9ECE4] text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Subscriptions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-t border-[#E5D5CD]/60 align-top">
                  <td className="px-4 py-3 break-all">{s.email}</td>
                  <td className="px-4 py-3">{s.name || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {s.subscriptions.map((sub, i) => (
                        <span
                          key={i}
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            sub.status === "active"
                              ? "bg-green-100 text-green-800"
                              : sub.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-200 text-gray-600"
                          }`}
                          title={sub.status}
                        >
                          {sub.specialization}
                        </span>
                      ))}
                      {s.subscriptions.length === 0 && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {subscribers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">
                    No subscribers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function FeedAdder({
  slug,
  busy,
  onAdd,
}: {
  slug: string;
  busy: boolean;
  onAdd: (slug: string, name: string, feedUrl: string) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !url.trim()) return;
        onAdd(slug, name.trim(), url.trim());
        setName("");
        setUrl("");
      }}
      className="mt-3 flex flex-col gap-2 sm:flex-row"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Feed name (e.g. PubMed)"
        className="rounded-lg border border-[#A08C8A]/40 px-3 py-2 text-sm outline-none focus:border-[#A08C8A] sm:w-48"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://…/rss"
        className="flex-1 rounded-lg border border-[#A08C8A]/40 px-3 py-2 text-sm outline-none focus:border-[#A08C8A]"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-[#4A4A4A] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#333] disabled:opacity-60"
      >
        Add feed
      </button>
    </form>
  );
}
