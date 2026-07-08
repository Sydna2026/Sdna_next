import TokenAction from "../components/TokenAction";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <TokenAction
      token={token ?? ""}
      endpoint="/api/unsubscribe"
      promptHeading="Unsubscribe"
      promptText="Click below to stop receiving these updates."
      buttonLabel="Unsubscribe"
      successHeading="You've unsubscribed"
      successTemplate="You will no longer receive {title} updates. You can re-subscribe anytime from the guidelines page."
    />
  );
}
