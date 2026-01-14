import EvidenceContent from "../EvidenceContent";
import { validHashCheck } from "@/lib/helpers";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EvidencePage({ params }: PageProps) {
  const { id } = await params;
  const idStatus = validHashCheck(id, "ID");

  if (idStatus !== "valid") {
    return (
      <div className="p-6 text-5xl text-center text-red-600">
        Invalid Evidence ID in URL:<br></br>
        {idStatus}.
      </div>
    );
  }

  return <EvidenceContent key={id} evidenceId={id as `0x${string}`} />;
}
