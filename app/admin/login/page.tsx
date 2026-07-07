"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[24px] border-2 border-[#A08C8A] bg-[#F9ECE4] p-8 text-[#4A4A4A] shadow-2xl"
      >
        <h1 className="text-2xl font-black mb-1">Admin</h1>
        <p className="text-sm text-gray-600 mb-6">Sign in to manage the site.</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Admin email"
          autoComplete="username"
          autoFocus
          className="w-full rounded-xl border border-[#A08C8A]/40 bg-white px-4 py-3 text-sm outline-none focus:border-[#A08C8A] mb-3"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          autoComplete="current-password"
          className="w-full rounded-xl border border-[#A08C8A]/40 bg-white px-4 py-3 text-sm outline-none focus:border-[#A08C8A]"
        />
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-[#4A4A4A] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#333] disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
