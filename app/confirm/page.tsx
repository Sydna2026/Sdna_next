import TokenAction from "../components/TokenAction";

export const dynamic = "force-dynamic";

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <TokenAction
      token={token ?? ""}
      endpoint="/api/confirm"
      autoRun
      promptHeading="Confirming your subscription"
      promptText="Click the button below to confirm and start receiving new-research updates."
      buttonLabel="Confirm subscription"
      successHeading="Subscription confirmed"
      successTemplate="You'll now receive {title} updates whenever new research is published."
    />
  );
}
