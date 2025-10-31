import FetchEvidenceForm from "@/components/web3/FetchEvidenceForm";

export default function Home() {
  return (
    <div className="space-y-10">
      <p className="font-sans w-200 text-center font-[400] text-5xl text-orange-700">
        Enter Evidence ID
      </p>
      <FetchEvidenceForm />
    </div>
  );
}
