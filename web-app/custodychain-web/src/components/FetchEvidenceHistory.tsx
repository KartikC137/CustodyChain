// "use client";

// import Link from "next/link";
// import { useEffect, useState } from "react";
// import {
//   type AccountProfile,
//   type Evidence,
//   useMockDb,
// } from "@/lib/contexts/MockDBContext";
// import { useWeb3 } from "@/lib/contexts/web3/Web3Context";

// export default function FetchedEvidenceHistory() {
//   const { account, isLoading: isWeb3Loading } = useWeb3();
//   const { allAccounts } = useMockDb();

//   const [fetchedEvidence, setFetchedEvidence] = useState<Evidence[]>([]);

//   useEffect(() => {
//     if (account && !isWeb3Loading) {
//       const profile: AccountProfile | undefined = allAccounts.find(
//         (p) => p.address.toLowerCase() === account.toLowerCase()
//       );
//       console.log("Fetch History: Mock Db Profile called", profile);
//       if (profile) {
//         const fetched = profile.evidencesFetched;
//         setFetchedEvidence(fetched);
//       } else {
//         setFetchedEvidence([]);
//       }
//     } else if (!account && !isWeb3Loading) {
//       setFetchedEvidence([]);
//     }
//   }, [account, allAccounts, isWeb3Loading]);

//   if (isWeb3Loading) {
//     return <div className="p-6 text-center">Loading your evidence...</div>;
//   }

//   if (!account) {
//     return (
//       <div className="p-6 text-center text-orange-600">
//         Please connect your wallet to view your evidence.
//       </div>
//     );
//   }

//   return (
//     <div className="p-10 space-y-6 bg-orange-50 rounded-md border-2 border-orange-700">
//       <h2 className="text-xl font-semibold"> Fetched Evidences History</h2>
//       {fetchedEvidence?.length > 0 ? (
//         <ul className="space-y-2 list-disc list-inside">
//           {fetchedEvidence.map((item) => (
//             <li key={item.evidenceId} className="text-orange-800">
//               <Link
//                 href={`/evidence/${item.evidenceId}`}
//                 className="hover:underline font-mono font-semibold text-lg"
//               >
//                 {item.description} ({item.evidenceId})
//               </Link>
//               {item.currentOwner.toLowerCase() !== account.toLowerCase() && (
//                 <span className="text-lg text-gray-500 ml-2">
//                   (Owned by: {item.currentOwner.slice(0, 6)}...)
//                 </span>
//               )}
//               {!item.isActive && (
//                 <span className="text-lg text-red-500 ml-2">
//                   (Discontinued)
//                 </span>
//               )}
//             </li>
//           ))}
//         </ul>
//       ) : (
//         <p className="text-sm text-gray-500">
//           You haven't fetched any evidence yet.
//         </p>
//       )}
//     </div>
//   );
// }
