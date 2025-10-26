import ConnectWalletButton from "../components/web3/ConnectWalletButton";
import CreateEvidenceForm from "@/components/web3/CreateEvidence";
import FetchEvidence from "@/components/web3/FetchEvidence";

export default function Home() {
  return (
    <>
      <div className="p-6">
        <h1 className="font-bold font-size text-2xl">
          Welcome to Custody-Chain
        </h1>
        <p className="font-sans">
          Blockchain Based Evidence Management And Chain Of Custody
        </p>
        <ConnectWalletButton />
      </div>
      <div className="font-sans m-1 border rounded-lg">
        <CreateEvidenceForm />
      </div>
      <div className="font-sans m-1 border rounded-lg">
        <FetchEvidence />
      </div>
    </>
  );
}
