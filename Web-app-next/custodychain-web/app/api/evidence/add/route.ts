// MOCK DATABASE UPDATER

// import { NextResponse } from "next/server";
// import fs from "fs/promises";
// import path from "path";
// import { type Address } from "viem";

// interface MockEvidence {
//   evidenceId: `0x${string}`;
//   description: string;
//   creator: Address;
//   currentOwner: Address;
// }

// const dataFilePath = path.join(process.cwd(), "lib", "data", "evidences.json");

// export async function POST(request: Request) {
//   let evidences: MockEvidence[] = [];

//   try {
//     const newData: MockEvidence = await request.json();

//     if (
//       !newData.evidenceId ||
//       !newData.description ||
//       !newData.creator ||
//       !newData.currentOwner ||
//       !newData.evidenceId.startsWith("0x") ||
//       newData.evidenceId.length !== 66 ||
//       !newData.creator.startsWith("0x") ||
//       newData.creator.length !== 42 ||
//       !newData.currentOwner.startsWith("0x") ||
//       newData.currentOwner.length !== 42
//     ) {
//       return NextResponse.json(
//         { success: false, error: "Invalid or missing required evidence data." },
//         { status: 400 }
//       );
//     }

//     try {
//       const fileContent = await fs.readFile(dataFilePath, "utf-8");
//       evidences = JSON.parse(fileContent);
//       if (!Array.isArray(evidences)) {
//         console.warn(
//           "evidences.json did not contain a valid array. Re-initializing."
//         );
//         evidences = [];
//       }
//     } catch (readError: any) {
//       if (readError.code === "ENOENT" || readError instanceof SyntaxError) {
//         console.warn(
//           `evidences.json not found or invalid. Creating/overwriting with new data.`
//         );
//         evidences = [];
//       } else {
//         throw readError;
//       }
//     }

//     const exists = evidences.some(
//       (e) => e.evidenceId.toLowerCase() === newData.evidenceId.toLowerCase()
//     );
//     if (exists) {
//       console.log(
//         `Evidence ID ${newData.evidenceId} already exists in mock data. Skipping add.`
//       );

//       return NextResponse.json(
//         { success: true, message: "Evidence ID already exists." },
//         { status: 200 }
//       );
//     } else {
//       evidences.push(newData);
//     }

//     try {
//       const updatedData = JSON.stringify(evidences, null, 2);
//       await fs.writeFile(dataFilePath, updatedData, "utf-8");
//     } catch (writeError) {
//       console.error(
//         "Failed to write updated data to evidences.json:",
//         writeError
//       );
//       throw new Error("Server error occurred while saving evidence data.");
//     }

//     return NextResponse.json(
//       { success: true, message: "Evidence added successfully to mock data." },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("API Error in POST /api/evidence/add:", error);
//     const errorMessage =
//       error instanceof Error
//         ? error.message
//         : "An unknown server error occurred.";
//     return NextResponse.json(
//       { success: false, error: errorMessage },
//       { status: 500 }
//     );
//   }
// }
