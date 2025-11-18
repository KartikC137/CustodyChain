// "use client";

// import Link from "next/link";
// import { useEffect, useState } from "react";
// import {
//   type AccountProfile,
//   type Evidence,
//   useMockDb,
// } from "@/lib/contexts/MockDBContext";
// import { useWeb3 } from "@/lib/contexts/web3/Web3Context";

// export default function CreatedEvidenceHistory() {
//   const { account } = useWeb3();
//   const { allAccounts } = useMockDb();

//   const [createdEvidence, setCreatedEvidence] = useState<Evidence[]>([]);

//   useEffect(() => {
//     if (account) {
//       const profile: AccountProfile | undefined = allAccounts.find(
//         (p) => p.address.toLowerCase() === account.toLowerCase()
//       );

//       if (profile) {
//         setCreatedEvidence(profile.evidencesCreated);
//       } else {
//         setCreatedEvidence([]);
//       }
//     } else if (!account) {
//       setCreatedEvidence([]);
//     }
//   }, [account, allAccounts]);

//   if (!account) {
//     return (
//       <div className="p-6 text-center text-orange-600">
//         Please connect your wallet to view your evidence.
//       </div>
//     );
//   }

//   return (
//     <div className="p-10 space-y-6 bg-orange-50 rounded-md border-2 border-orange-700">
//       <h2 className="text-xl font-semibold">Evidence You Created</h2>
//       {createdEvidence?.length > 0 ? (
//         <ul className="space-y-2 list-disc list-inside">
//           {createdEvidence.map((item) => (
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
//           You haven't created any evidence yet.
//         </p>
//       )}
//     </div>
//   );
// }
