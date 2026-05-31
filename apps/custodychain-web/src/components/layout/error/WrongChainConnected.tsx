export default function WrongChainConnected({
  correctChainId,
}: {
  correctChainId: number;
}) {
  return (
    <div className="flex items-center justify-center bg-black/90">
      <div className="p-8 text-center bg-red-950 border border-red-500 rounded-xl">
        <h2 className="text-3xl font-mono text-red-500 mb-4">
          Wrong Network Detected
        </h2>
        <p className="text-white font-mono">
          Please open your wallet and switch to {} (Chain ID:
          {correctChainId}).
        </p>
      </div>
    </div>
  );
}
