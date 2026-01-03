// import CreatedEvidenceHistory from "@/components/layout/CreateEvidenceHistory";
import CreateEvidenceForm from "@/components/web3/forms/CreateEvidenceForm";

export default function CreateEvidencePage() {
  return (
    <div className="p-10 bg-orange-50 rounded-md border-2 border-orange-700">
      <CreateEvidenceForm />
      {/* <CreatedEvidenceHistory /> */}
    </div>
  );
}
