import FetchEvidence from "@/components/web3/FetchEvidence";
interface EvidencePageProps {
  params: {
    id: string;
  };
}

export default async function EvidencePage({ params }: EvidencePageProps) {
  const { id } = await params;
  const evidenceIdFromUrl = id;
  const isValidIdFormat =
    evidenceIdFromUrl?.startsWith("0x") && evidenceIdFromUrl.length === 66;

  if (!isValidIdFormat) {
    return (
      <div className="p-6 text-center text-red-600">
        Error: Invalid Evidence ID format in URL.
      </div>
    );
  }

  return (
    <div>
      <FetchEvidence evidenceId={evidenceIdFromUrl as `0x${string}`} />
    </div>
  );
}
