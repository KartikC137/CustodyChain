    // SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// import {Test} from "forge-std/Test.sol";
// import {EvidenceLedger} from "../../src/EvidenceLedger.sol";

// contract EvidenceLedgerTest_Unit is Test {
//     EvidenceLedger ledger;

//     event EvidenceCreated(address indexed creator, bytes32 indexed evidenceId, string indexed description);

//     function setUp() public {
//         ledger = new EvidenceLedger();
//     }

//     function testCreateEvidenceEmitsEventAndStoresAddress() public {
//         bytes32 evidenceId = keccak256(abi.encodePacked("evidence-1"));
//         string memory description = "Test evidence 1";

//         address caller = address(0xABCD);
//         vm.prank(caller);

//         vm.expectEmit(true, true, true, true);
//         emit EvidenceCreated(caller, evidenceId, description);

//         ledger.createEvidence(evidenceId, description);

//         address evidenceAddr = ledger.getEvidenceContractAddress(evidenceId);
//         assertTrue(evidenceAddr != address(0), "Evidence contract address should be non-zero");
//     }

//     function testCreatingTwiceOverwritesPreviousAddress() public {
//         bytes32 evidenceId = keccak256(abi.encodePacked("evidence-dup"));
//         string memory descriptionA = "First";
//         string memory descriptionB = "Second";

//         address alice = address(0xAAA);
//         address bob = address(0xBBB);

//         vm.prank(alice);
//         ledger.createEvidence(evidenceId, descriptionA);
//         address addrA = ledger.getEvidenceContractAddress(evidenceId);
//         assertTrue(addrA != address(0), "First created address should be non-zero");

//         vm.prank(bob);
//         ledger.createEvidence(evidenceId, descriptionB);
//         address addrB = ledger.getEvidenceContractAddress(evidenceId);
//         assertTrue(addrB != address(0), "Second created address should be non-zero");
//         assertTrue(addrA != addrB, "New creation should overwrite the mapping with a different contract address");
//     }

//     function testCreateMultipleEvidenceIdsStoresSeparately() public {
//         bytes32 id1 = keccak256(abi.encodePacked("evidence-A"));
//         bytes32 id2 = keccak256(abi.encodePacked("evidence-B"));

//         string memory desc1 = "Evidence A";
//         string memory desc2 = "Evidence B";

//         address caller = address(this);

//         vm.prank(caller);
//         ledger.createEvidence(id1, desc1);
//         vm.prank(caller);
//         ledger.createEvidence(id2, desc2);

//         address addr1 = ledger.getEvidenceContractAddress(id1);
//         address addr2 = ledger.getEvidenceContractAddress(id2);

//         assertTrue(addr1 != address(0), "addr1 should be non-zero");
//         assertTrue(addr2 != address(0), "addr2 should be non-zero");
//         assertTrue(addr1 != addr2, "Different evidence IDs should map to different deployed contract addresses");
//     }
// }
