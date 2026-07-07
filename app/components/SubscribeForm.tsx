"use client";

import React, { useState } from "react";

interface SubscribeFormProps {
  slug: string;
  title: string;
}

type Status = "idle" | "loading" | "pending" | "already" | "error";

export default function SubscribeForm({ slug, title }: SubscribeFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  const submitting = status === "loading";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, slug }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setStatus(data.status === "already" ? "already" : "pending");
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  if (status === "pending" || status === "already") {
    return (
      <div className="rounded-2xl border border-[#A08C8A]/40 bg-white/70 p-5 text-sm text-[#4A4A4A]">
        {status === "pending" ? (
          <p className="leading-relaxed">
            Almost there — we sent a confirmation link to{" "}
            <strong>{email}</strong>. Click it to start receiving{" "}
            <strong>{title}</strong> updates.
          </p>
        ) : (
          <p className="leading-relaxed">
            You&apos;re already subscribed to <strong>{title}</strong> updates. 🎉
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-gray-700 leading-relaxed">
        Get an email when new <strong>{title}</strong> research is published.
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        autoComplete="name"
        className="w-full rounded-xl border border-[#A08C8A]/40 bg-white px-4 py-3 text-sm text-[#4A4A4A] outline-none focus:border-[#A08C8A]"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        className="w-full rounded-xl border border-[#A08C8A]/40 bg-white px-4 py-3 text-sm text-[#4A4A4A] outline-none focus:border-[#A08C8A]"
      />
      {status === "error" && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-[#A08C8A] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#8e7a78] disabled:opacity-60"
      >
        {submitting ? "Subscribing…" : "Subscribe to updates"}
      </button>
    </form>
  );
}
