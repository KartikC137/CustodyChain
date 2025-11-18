// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {EvidenceLedger} from "../../src/EvidenceLedger.sol";
import {Evidence} from "../../src/ChainOfCustody.sol";

contract CustodyChain_Integration is Test {
    EvidenceLedger ledger;

    event EvidenceCreated(address indexed creator, bytes32 indexed evidenceId, string indexed description);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner, uint256 indexed timeOfTransfer);
    event EvindenceDiscontinued(bytes32 indexed evidenceId);

    function setUp() public {
        ledger = new EvidenceLedger();
    }

    /* --------------------------------------------------------
       Helper: create evidence through ledger (simulates user)
       Returns the Evidence contract instance deployed by ledger
       -------------------------------------------------------- */
    function _createEvidenceThroughLedger(address caller, bytes32 evidenceId, string memory description)
        internal
        returns (Evidence evidence)
    {
        vm.prank(caller);
        ledger.createEvidence(evidenceId, description);
        address evidenceAddr = ledger.getEvidenceContractAddress(evidenceId);
        require(evidenceAddr != address(0), "evidence address zero");
        evidence = Evidence(evidenceAddr);
    }

    /* --------------------------------------------------------
       Creation: ledger emits event and mapping stores address
       -------------------------------------------------------- */
    function test_createEvidence_emitsEvent_and_mappingStoresAddress() public {
        bytes32 id = keccak256("integration-evidence-1");
        string memory desc = "Integration evidence creation";
        address creator = address(0xBEEF);

        vm.prank(creator);
        vm.expectEmit(true, true, true, true);
        emit EvidenceCreated(creator, id, desc);

        ledger.createEvidence(id, desc);

        address saved = ledger.getEvidenceContractAddress(id);
        assertTrue(saved != address(0), "ledger mapping should have a non-zero evidence address");
    }

    /* --------------------------------------------------------
       After creation: Evidence getters return expected values
       -------------------------------------------------------- */
    function test_evidence_getters_match_creation_params() public {
        bytes32 id = keccak256("integration-evidence-2");
        string memory desc = "Check getters after creation";
        address creator = address(0xCAFE);

        vm.warp(1_700_010_000);

        Evidence ev = _createEvidenceThroughLedger(creator, id, desc);

        assertEq(ev.getEvidenceId(), id);
        assertEq(ev.getEvidenceCreator(), creator);
        assertEq(ev.getEvidenceDescription(), desc);

        uint256 toc = ev.getTimeOfCreation();
        assertEq(toc, 1_700_010_000);
    }

    /* --------------------------------------------------------
       Ownership transfer via Evidence: only current owner allowed
       -------------------------------------------------------- */
    function test_transferOwnership_onlyCurrentOwner_canTransfer_and_chainUpdated() public {
        bytes32 id = keccak256("integration-evidence-3");
        string memory desc = "transfer flow";
        address creator = address(0x1111);
        address newOwner = address(0x2222);

        Evidence ev = _createEvidenceThroughLedger(creator, id, desc);

        vm.prank(address(0xDEAD));
        vm.expectRevert(abi.encodeWithSelector(Evidence.Error_CallerIsNotCurrentOwner.selector));
        ev.transferOwnership(newOwner);

        vm.warp(1_700_200_000);
        uint256 expectedTs = block.timestamp;

        vm.prank(creator);
        vm.expectEmit(true, true, true, true);
        emit OwnershipTransferred(creator, newOwner, expectedTs);
        ev.transferOwnership(newOwner);

        assertEq(ev.getCurrentOwner(), newOwner);
    }

    /* --------------------------------------------------------
       Ledger mapping remains consistent: ledger -> evidence storage
       -------------------------------------------------------- */
    function test_ledger_returns_sameAddress_as_deployedEvidence_and_evidenceStateAccessible() public {
        bytes32 id = keccak256("integration-evidence-4");
        string memory desc = "ledger mapping consistency";
        address creator = address(0x5555);

        vm.prank(creator);
        ledger.createEvidence(id, desc);

        address evidenceAddrFromLedger = ledger.getEvidenceContractAddress(id);
        assertTrue(evidenceAddrFromLedger != address(0), "evidence address must not be zero");

        Evidence ev = Evidence(evidenceAddrFromLedger);
        assertEq(ev.getEvidenceCreator(), creator);
    }

    /* --------------------------------------------------------
       Discontinue: only creator can discontinue; effects observed
       -------------------------------------------------------- */
    function test_discontinue_onlyCreator_setsInactive_and_blocksTransfers() public {
        bytes32 id = keccak256("integration-evidence-5");
        string memory desc = "discontinue flow";
        address creator = address(0x9999);
        address attacker = address(0xBAAD);

        vm.warp(1_700_020_000);
        Evidence ev = _createEvidenceThroughLedger(creator, id, desc);

        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(Evidence.Error_CallerIsNotCreator.selector));
        ev.discontinueEvidence();

        vm.warp(1_700_020_100);
        vm.prank(creator);
        vm.expectEmit(true, false, false, true);
        emit EvindenceDiscontinued(id);
        ev.discontinueEvidence();

        assertFalse(ev.getEvidenceState(), "evidence should be inactive after discontinue");
        assertEq(ev.getTimeOfDiscontinuation(), 1_700_020_100);

        vm.prank(creator);
        vm.expectRevert(abi.encodeWithSelector(Evidence.Error_EvindenceDiscontinued.selector));
        ev.transferOwnership(address(0x1));
    }

    /* --------------------------------------------------------
       Ledger overwrite behavior: creating with same id replaces address
       -------------------------------------------------------- */
    function test_ledger_overwrite_behavior_creating_sameId_redeploysEvidence() public {
        bytes32 id = keccak256("integration-evidence-6");
        string memory descA = "first instance";
        string memory descB = "second instance";
        address alice = address(0xA1);
        address bob = address(0xB1);

        Evidence e1 = _createEvidenceThroughLedger(alice, id, descA);
        address addr1 = address(e1);

        Evidence e2 = _createEvidenceThroughLedger(bob, id, descB);
        address addr2 = address(e2);

        assertTrue(addr1 != addr2, "new creation should produce a different contract address");
        assertEq(ledger.getEvidenceContractAddress(id), addr2);
    }
}
