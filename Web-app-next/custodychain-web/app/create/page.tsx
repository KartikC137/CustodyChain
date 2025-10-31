import CreateEvidenceForm from "@/components/web3/CreateEvidence";

export default function CreateEvidencePage() {
  return (
    <div className="space-y-10">
      <p className="font-sans w-200 text-center font-[400] text-5xl text-orange-700">
        Enter Evidence Description
      </p>
      <CreateEvidenceForm />
    </div>
  );
}
