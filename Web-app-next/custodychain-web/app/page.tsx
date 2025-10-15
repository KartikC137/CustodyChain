import ConnectWalletButton from "../components/web3/ConnectWalletButton";
import CreateEvidenceForm from "@/components/web3/CreateEvidence";
import GetEvidenceInfo from "@/components/web3/GetEvidenceInfo";

export default function Home() {
  return (
    <>
      <div>
        <h1 className="font-sans font-bold font-size text-2xl">
          Welcome to Custody-Chain
        </h1>
        <p className="font-sans">
          Blockchain Based Evidence Management And Chain Of Custody
        </p>
      </div>
      <div className="font-sans w-100px h-100px">
        <ConnectWalletButton />
      </div>
      <div className="font-sans">
        <CreateEvidenceForm />
      </div>
      <div className="font-sans">
        <GetEvidenceInfo />
      </div>
    </>
  );
}
