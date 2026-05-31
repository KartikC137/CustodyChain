import FetchEvidenceHistory from "@/src/components/features/evidence-details/FetchEvidenceHistory";
import FetchEvidenceForm from "@/src/components/features/forms/FetchEvidenceForm";

export default function Home() {
  return (
    <>
      <FetchEvidenceForm />
      <FetchEvidenceHistory />
    </>
  );
}
