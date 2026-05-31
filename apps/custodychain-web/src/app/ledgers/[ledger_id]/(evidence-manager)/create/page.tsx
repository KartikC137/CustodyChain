import CreateEvidenceHistory from "@/src/components/features/evidence-details/CreateEvidenceHistory";
import CreateEvidenceForm from "@/src/components/features/forms/CreateEvidenceForm";

export default function CreateEvidencePage() {
  return (
    <div>
      <CreateEvidenceForm />
      <CreateEvidenceHistory />
    </div>
  );
}
