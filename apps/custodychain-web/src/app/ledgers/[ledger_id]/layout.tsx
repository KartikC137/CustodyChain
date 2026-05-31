import { LedgerProvider } from "@/src/context-and-hooks/LedgerContext";

export default async function LedgerLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ ledger_id: string }>;
}>) {
  const _ledgerIdUrl = (await params).ledger_id;

  return (
    <LedgerProvider key={_ledgerIdUrl} ledgerIdUrl={_ledgerIdUrl}>
      {children}
    </LedgerProvider>
  );
}
