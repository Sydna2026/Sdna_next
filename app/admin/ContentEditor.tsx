"use client";

import React, { useCallback, useEffect, useState } from "react";
import type {
  HomeContent,
  ContactContent,
  FooterContent,
  BrandingContent,
  GuidelineContent,
} from "@/lib/defaults";

interface Bundle {
  home: HomeContent;
  contact: ContactContent;
  footer: FooterContent;
  branding: BrandingContent;
  guidelines: GuidelineContent[];
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#A08C8A]/40 px-3 py-2 text-sm outline-none focus:border-[#A08C8A]"
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
        {label}
      </span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#A08C8A]/40 px-3 py-2 text-sm outline-none focus:border-[#A08C8A]"
      />
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E5D5CD] bg-white p-5 shadow-sm space-y-3">
      <h3 className="text-sm font-black uppercase tracking-wider text-[#A08C8A]">{title}</h3>
      {children}
    </div>
  );
}

export default function ContentEditor({
  onAuthError,
}: {
  onAuthError: (r: Response) => boolean;
}) {
  const [b, setB] = useState<Bundle | null>(null);
  const [notice, setNotice] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newRefs, setNewRefs] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/content");
    if (onAuthError(r)) return;
    const d = await r.json();
    if (d.ok) setB(d.content);
  }, [onAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  if (!b) return <p className="text-sm text-gray-500">Loading content…</p>;

  const update = <K extends keyof Bundle>(key: K, value: Bundle[K]) =>
    setB({ ...b, [key]: value });

  async function saveSection(key: "home" | "contact" | "footer" | "branding") {
    setNotice("Saving…");
    const r = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: b![key] }),
    });
    if (onAuthError(r)) return;
    const d = await r.json();
    setNotice(d.ok ? "Saved." : d.error || "Save failed.");
  }

  async function saveGuideline(g: GuidelineContent) {
    setNotice("Saving…");
    const r = await fetch("/api/admin/specializations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: g.slug,
        title: g.title,
        description: g.desc,
        details: g.details,
      }),
    });
    if (onAuthError(r)) return;
    const d = await r.json();
    setNotice(d.ok ? "Saved." : d.error || "Save failed.");
  }

  async function deleteGuideline(slug: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This also removes its feeds, articles and subscriptions.`)) {
      return;
    }
    setNotice("Deleting…");
    const r = await fetch(`/api/admin/specializations?slug=${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
    if (onAuthError(r)) return;
    const d = await r.json();
    if (d.ok) {
      setNotice("Deleted.");
      await load();
    } else {
      setNotice(d.error || "Delete failed.");
    }
  }

  async function addGuideline() {
    if (!newTitle.trim()) {
      setNotice("Enter a title for the new guideline.");
      return;
    }
    setNotice("Adding…");
    const details = newRefs.split("\n").map((s) => s.trim()).filter(Boolean);
    const r = await fetch("/api/admin/specializations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim(), details }),
    });
    if (onAuthError(r)) return;
    const d = await r.json();
    if (d.ok) {
      setNewTitle("");
      setNewDesc("");
      setNewRefs("");
      setNotice("Guideline added.");
      await load();
    } else {
      setNotice(d.error || "Add failed.");
    }
  }

  const SaveBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="rounded-lg bg-[#4A4A4A] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#333]"
    >
      Save
    </button>
  );

  return (
    <div className="space-y-5">
      {notice && (
        <div className="sticky top-2 z-10 rounded-xl border border-[#A08C8A]/40 bg-[#F9ECE4] px-4 py-2 text-sm">
          {notice}
        </div>
      )}

      {/* Branding */}
      <Card title="Branding">
        <Field label="Brand" value={b.branding.brand} onChange={(v) => update("branding", { ...b.branding, brand: v })} />
        <Field label="Subtitle" value={b.branding.subtitle} onChange={(v) => update("branding", { ...b.branding, subtitle: v })} />
        <SaveBtn onClick={() => saveSection("branding")} />
      </Card>

      {/* Footer */}
      <Card title="Footer">
        <Field label="Copyright line" value={b.footer.copyright} onChange={(v) => update("footer", { copyright: v })} />
        <SaveBtn onClick={() => saveSection("footer")} />
      </Card>

      {/* Home */}
      <Card title="Home page">
        <Field label="Hero line 1" value={b.home.heroLine1} onChange={(v) => update("home", { ...b.home, heroLine1: v })} />
        <Field label="Hero line 2" value={b.home.heroLine2} onChange={(v) => update("home", { ...b.home, heroLine2: v })} />
        <Area label="Hero subtitle" value={b.home.heroSubtitle} onChange={(v) => update("home", { ...b.home, heroSubtitle: v })} />
        <Field label="About heading" value={b.home.aboutHeading} onChange={(v) => update("home", { ...b.home, aboutHeading: v })} />
        {b.home.cards.map((c, i) => (
          <div key={i} className="rounded-lg bg-[#F9ECE4] p-3 space-y-2">
            <Field label={`Card ${i + 1} title`} value={c.title} onChange={(v) => {
              const cards = [...b.home.cards];
              cards[i] = { ...cards[i], title: v };
              update("home", { ...b.home, cards });
            }} />
            <Area label={`Card ${i + 1} text`} value={c.desc} onChange={(v) => {
              const cards = [...b.home.cards];
              cards[i] = { ...cards[i], desc: v };
              update("home", { ...b.home, cards });
            }} />
          </div>
        ))}
        <SaveBtn onClick={() => saveSection("home")} />
      </Card>

      {/* Contact & Join */}
      <Card title="Contact & Join">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Admin name" value={b.contact.adminName} onChange={(v) => update("contact", { ...b.contact, adminName: v })} />
          <Field label="Admin title" value={b.contact.adminTitle} onChange={(v) => update("contact", { ...b.contact, adminTitle: v })} />
          <Field label="Contact email" value={b.contact.email} onChange={(v) => update("contact", { ...b.contact, email: v })} />
          <Field label="Phone / WhatsApp" value={b.contact.phone} onChange={(v) => update("contact", { ...b.contact, phone: v })} />
          <Field label="Official Gmail" value={b.contact.gmail} onChange={(v) => update("contact", { ...b.contact, gmail: v })} />
          <Field label="Instagram URL" value={b.contact.instagram} onChange={(v) => update("contact", { ...b.contact, instagram: v })} />
          <Field label="LinkedIn URL" value={b.contact.linkedin} onChange={(v) => update("contact", { ...b.contact, linkedin: v })} />
          <Field label="Join form URL" value={b.contact.joinFormUrl} onChange={(v) => update("contact", { ...b.contact, joinFormUrl: v })} />
          <Field label="Share ideas URL" value={b.contact.shareIdeasUrl} onChange={(v) => update("contact", { ...b.contact, shareIdeasUrl: v })} />
        </div>
        <SaveBtn onClick={() => saveSection("contact")} />
      </Card>

      {/* Guidelines */}
      <Card title="Guidelines">
        <div className="space-y-4">
          {b.guidelines.map((g, i) => (
            <div key={g.slug} className="rounded-lg bg-[#F9ECE4] p-3 space-y-2">
              <Field label="Title" value={g.title} onChange={(v) => {
                const gs = [...b.guidelines];
                gs[i] = { ...gs[i], title: v };
                update("guidelines", gs);
              }} />
              <Area label="Description" value={g.desc} onChange={(v) => {
                const gs = [...b.guidelines];
                gs[i] = { ...gs[i], desc: v };
                update("guidelines", gs);
              }} />
              <Area label="References (one per line — links are shown as clickable)" rows={4} value={g.details.join("\n")} onChange={(v) => {
                const gs = [...b.guidelines];
                gs[i] = { ...gs[i], details: v.split("\n") };
                update("guidelines", gs);
              }} />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveGuideline({ ...g, details: g.details.filter((d) => d.trim()) })}
                  className="rounded-lg bg-[#A08C8A] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#8e7a78]"
                >
                  Save
                </button>
                <button
                  onClick={() => deleteGuideline(g.slug, g.title)}
                  className="rounded-lg border border-red-300 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-dashed border-[#A08C8A]/50 p-3 space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#A08C8A]">Add a new guideline</h4>
          <Field label="Title" value={newTitle} onChange={setNewTitle} />
          <Area label="Description" value={newDesc} onChange={setNewDesc} />
          <Area label="References (one per line)" rows={3} value={newRefs} onChange={setNewRefs} />
          <button
            onClick={addGuideline}
            className="rounded-lg bg-[#4A4A4A] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#333]"
          >
            Add guideline
          </button>
        </div>
      </Card>
    </div>
  );
}
