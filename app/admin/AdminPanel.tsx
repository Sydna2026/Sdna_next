"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "./Dashboard";
import ContentEditor from "./ContentEditor";

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

type Tab = "dashboard" | "content" | "feeds" | "subscribers";

const MENU: { key: Tab; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "M3 3v18h18M8 17V9m4 8V5m4 12v-6" },
  { key: "content", label: "Content", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { key: "feeds", label: "Feeds", icon: "M4 11a9 9 0 019 9M4 4a16 16 0 0116 16M6 19a1 1 0 100-2 1 1 0 000 2z" },
  { key: "subscribers", label: "Subscribers", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z" },
];

export default function AdminPanel() {
  const router = useRouter();
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [tab, setTab] = useState<Tab>("dashboard");
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

  const SideIcon = ({ d }: { d: string }) => (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
    </svg>
  );

  return (
    <div className="min-h-screen flex bg-[#F1E7DF]">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-16 md:w-64 shrink-0 flex-col bg-[#3D3D3D] text-white">
        <div className="flex items-center gap-2 px-4 md:px-6 h-16 border-b border-white/10">
          <span className="text-lg font-black tracking-wider text-[#F9ECE4] hidden md:inline">SYDAN</span>
          <span className="text-lg font-black text-[#A08C8A] md:hidden">S</span>
          <span className="text-[10px] uppercase tracking-widest text-[#A08C8A] hidden md:inline">Admin</span>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 md:px-3">
          {MENU.map((m) => (
            <button
              key={m.key}
              onClick={() => setTab(m.key)}
              title={m.label}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                tab === m.key ? "bg-[#A08C8A] text-white" : "text-white/70 hover:bg-white/10"
              }`}
            >
              <SideIcon d={m.icon} />
              <span className="hidden md:inline">{m.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-2 md:p-3 space-y-1">
          <button
            onClick={runIngestion}
            disabled={busy}
            title="Run ingestion now"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-60"
          >
            <SideIcon d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114-3M20 15a8 8 0 01-14 3" />
            <span className="hidden md:inline">Run ingestion</span>
          </button>
          <button
            onClick={logout}
            title="Log out"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/80 hover:bg-white/10"
          >
            <SideIcon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            <span className="hidden md:inline">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 px-5 py-6 md:px-10 md:py-10 text-[#4A4A4A]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-black capitalize">{tab}</h1>
          </div>

          {notice && (
            <div className="mb-6 rounded-xl border border-[#A08C8A]/40 bg-white px-4 py-3 text-sm shadow-sm">
              {notice}
            </div>
          )}

          {tab === "dashboard" && <Dashboard onAuthError={handleAuthError} />}

          {tab === "content" && <ContentEditor onAuthError={handleAuthError} />}

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
        </div>
      </main>
    </div>
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
