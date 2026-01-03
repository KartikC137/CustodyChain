// import FetchedEvidenceHistory from "@/components/layout/FetchEvidenceHistory";
import FetchEvidenceForm from "@/components/web3/forms/FetchEvidenceForm";

export default function Home() {
  return (
    <div className="p-10 bg-orange-50 rounded-md border-2 border-orange-700">
      <FetchEvidenceForm />
      {/* <FetchedEvidenceHistory /> */}
    </div>
  );
}
