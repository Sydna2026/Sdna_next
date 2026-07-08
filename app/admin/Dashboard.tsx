"use client";

import React, { useEffect, useState } from "react";

interface DashboardData {
  stats: { totalSubscribers: number; active: number; pending: number; unsubscribed: number };
  specializations: {
    slug: string;
    title: string;
    feeds: number;
    articles: number;
    subscribersActive: number;
  }[];
  recentSubscribers: { email: string; name: string | null; createdAt: string }[];
  recentArticles: { title: string; link: string; specialization: string; createdAt: string }[];
  lastIngest: {
    ranAt: string;
    feedsChecked: number;
    feedsFailed: number;
    newArticles: number;
    emailsSent: number;
  } | null;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#E5D5CD] bg-white p-5 text-center shadow-sm">
      <div className="text-3xl font-black text-[#4A4A4A]">{value}</div>
      <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default function Dashboard({
  onAuthError,
  onSelectSpecialization,
}: {
  onAuthError: (r: Response) => boolean;
  onSelectSpecialization: (slug: string) => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard").then(async (r) => {
      if (onAuthError(r)) return;
      const d = await r.json();
      if (d.ok) setData(d);
    });
  }, [onAuthError]);

  if (!data) return <p className="text-sm text-gray-500">Loading dashboard…</p>;

  const fmt = (iso: string) => new Date(iso).toLocaleString();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Subscribers" value={data.stats.totalSubscribers} />
        <Stat label="Active" value={data.stats.active} />
        <Stat label="Pending" value={data.stats.pending} />
        <Stat label="Unsubscribed" value={data.stats.unsubscribed} />
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-[#A08C8A] mb-3">
          Ingestion status
        </h3>
        <div className="rounded-2xl border border-[#E5D5CD] bg-white p-5 text-sm shadow-sm">
          {data.lastIngest ? (
            <p>
              Last run <strong>{fmt(data.lastIngest.ranAt)}</strong> — checked{" "}
              {data.lastIngest.feedsChecked} feed(s)
              {data.lastIngest.feedsFailed ? `, ${data.lastIngest.feedsFailed} failed` : ""},{" "}
              {data.lastIngest.newArticles} new article(s), {data.lastIngest.emailsSent} email(s)
              sent.
            </p>
          ) : (
            <p className="text-gray-500">No ingestion has run yet.</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-[#A08C8A] mb-3">
          By specialization
        </h3>
        <p className="text-xs text-gray-500 mb-2">Click a row to see and manage its subscribers.</p>
        <div className="overflow-x-auto rounded-2xl border border-[#E5D5CD] bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F9ECE4] text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Specialization</th>
                <th className="px-4 py-3">Active subs</th>
                <th className="px-4 py-3">Feeds</th>
                <th className="px-4 py-3">Articles</th>
              </tr>
            </thead>
            <tbody>
              {data.specializations.map((s) => (
                <tr
                  key={s.slug}
                  onClick={() => onSelectSpecialization(s.slug)}
                  className="border-t border-[#E5D5CD]/60 cursor-pointer hover:bg-[#F9ECE4]"
                >
                  <td className="px-4 py-2.5 font-semibold text-[#A08C8A]">{s.title}</td>
                  <td className="px-4 py-2.5">{s.subscribersActive}</td>
                  <td className="px-4 py-2.5">{s.feeds}</td>
                  <td className="px-4 py-2.5">{s.articles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-[#A08C8A] mb-3">
            Recent signups
          </h3>
          <div className="rounded-2xl border border-[#E5D5CD] bg-white p-4 text-sm shadow-sm space-y-2">
            {data.recentSubscribers.length === 0 && (
              <p className="text-gray-400">None yet.</p>
            )}
            {data.recentSubscribers.map((s, i) => (
              <div key={i} className="flex justify-between gap-3">
                <span className="truncate">{s.name ? `${s.name} · ` : ""}{s.email}</span>
                <span className="shrink-0 text-gray-400">{fmt(s.createdAt).split(",")[0]}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-[#A08C8A] mb-3">
            Recent articles
          </h3>
          <div className="rounded-2xl border border-[#E5D5CD] bg-white p-4 text-sm shadow-sm space-y-2">
            {data.recentArticles.length === 0 && <p className="text-gray-400">None yet.</p>}
            {data.recentArticles.map((a, i) => (
              <div key={i} className="min-w-0">
                <a href={a.link} target="_blank" rel="noreferrer" className="text-[#A08C8A] break-words">
                  {a.title}
                </a>
                <span className="text-gray-400"> · {a.specialization}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
