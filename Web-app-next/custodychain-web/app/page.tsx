import FetchEvidenceForm from "@/components/web3/FetchEvidenceForm";

export default function Home() {
  return (
    <div className="p-10 bg-orange-50 rounded-md border-2 border-orange-700">
      <div className="p-10 space-y-4 w-200 bg-green-50 rounded-md border-2 border-green-700">
        <p className="font-sans font-[400] text-5xl text-orange-700">
          Enter Evidence ID
        </p>
        <FetchEvidenceForm />
      </div>
    </div>
  );
}
