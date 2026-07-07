import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; title?: string }>;
}) {
  const { status, title } = await searchParams;
  const ok = status === "done";

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full rounded-[24px] border-2 border-[#A08C8A] bg-[#F9ECE4] p-8 text-center text-[#4A4A4A] shadow-2xl">
        <h1 className="text-2xl font-black mb-3">
          {ok ? "You've unsubscribed" : "Link not valid"}
        </h1>
        <p className="text-sm text-gray-700 leading-relaxed mb-6">
          {ok
            ? `You will no longer receive ${title ?? "these"} updates. You can re-subscribe anytime from the guidelines page.`
            : "This unsubscribe link is invalid or has already been used."}
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-[#4A4A4A] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#333]"
        >
          Back to site
        </Link>
      </div>
    </main>
  );
}
