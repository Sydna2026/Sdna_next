"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface TokenActionProps {
  token: string;
  endpoint: string;
  promptHeading: string;
  promptText: string;
  buttonLabel: string;
  successHeading: string;
  // Plain string (not a function) so it can be passed from a Server Component.
  // "{title}" is replaced with the specialization title returned by the API.
  successTemplate: string;
  // When true, the action runs automatically on load (one click from the email)
  // instead of requiring a button press. Still safe: link prefetchers/scanners
  // fetch the page without running this JS, so they can't trigger it.
  autoRun?: boolean;
}

type State = "idle" | "loading" | "done" | "error";

export default function TokenAction(props: TokenActionProps) {
  const [state, setState] = useState<State>(
    props.token ? (props.autoRun ? "loading" : "idle") : "error",
  );
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [error, setError] = useState("This link is invalid.");
  const started = useRef(false);

  const run = useCallback(async () => {
    if (started.current) return; // guard against double-invocation
    started.current = true;
    setState("loading");
    try {
      const res = await fetch(props.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: props.token }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong.");
        setState("error");
        return;
      }
      setTitle(data.title);
      setState("done");
    } catch {
      setError("Network error. Please try again.");
      setState("error");
    }
  }, [props.endpoint, props.token]);

  useEffect(() => {
    if (props.autoRun && props.token) run();
  }, [props.autoRun, props.token, run]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full rounded-[24px] border-2 border-[#A08C8A] bg-[#F9ECE4] p-8 text-center text-[#4A4A4A] shadow-2xl">
        {state === "done" ? (
          <>
            <h1 className="text-2xl font-black mb-3">{props.successHeading}</h1>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              {props.successTemplate.replace("{title}", title ?? "")}
            </p>
          </>
        ) : state === "error" ? (
          <>
            <h1 className="text-2xl font-black mb-3">Link not valid</h1>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">{error}</p>
          </>
        ) : state === "loading" ? (
          <>
            <h1 className="text-2xl font-black mb-3">{props.promptHeading}</h1>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">One moment…</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black mb-3">{props.promptHeading}</h1>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">{props.promptText}</p>
            <button
              onClick={run}
              className="inline-block rounded-xl bg-[#A08C8A] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#8e7a78]"
            >
              {props.buttonLabel}
            </button>
          </>
        )}
        <div className={state === "done" || state === "error" ? "" : "mt-6"}>
          <Link
            href="/"
            className="inline-block rounded-xl bg-[#4A4A4A] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#333]"
          >
            Back to site
          </Link>
        </div>
      </div>
    </main>
  );
}
