// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Evidence} from "../../src/ChainOfCustody.sol";

/// @notice Small helper/deployer that acts like the EvidenceLedger when creating Evidence.
/// Evidence constructor expects msg.sender == _evidenceLedgerAddress, so we use this contract
/// to simulate the ledger deploying Evidence.
contract EvidenceDeployer {
    function createEvidence(
        address ledgerAddress,
        bytes32 evidenceId,
        address creator,
        address initialOwner,
        string memory description
    ) external returns (address) {
        Evidence e = new Evidence(ledgerAddress, evidenceId, creator, initialOwner, description);
        return address(e);
    }
}

contract EvidenceTest is Test {
    EvidenceDeployer deployer;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner, uint256 indexed timeOfTransfer);
    event EvindenceDiscontinued(bytes32 indexed evidenceId);

    function setUp() public {
        deployer = new EvidenceDeployer();
    }

    /* ===========================
       Helper to deploy Evidence
       =========================== */
    function _deployEvidence(bytes32 evidenceId, address creator, address initialOwner, string memory description)
        internal
        returns (Evidence)
    {
        address ledgerAddr = address(deployer);
        address evidenceAddr = deployer.createEvidence(ledgerAddr, evidenceId, creator, initialOwner, description);
        return Evidence(evidenceAddr);
    }

    /* ===========================
       Constructor tests
       =========================== */

    function testRevertUnauthorizedDeploymentWhenMsgSenderNotLedger() public {
        bytes32 id = keccak256("id");
        address creator = address(0x1);
        address initialOwner = creator;
        string memory desc = "desc";

        vm.expectRevert(abi.encodeWithSelector(Evidence.Error_UnauthorizedDeployment.selector));
        new Evidence(address(0xBEEF), id, creator, initialOwner, desc);
    }

    function testRevertIfCreatorIsNotInitialOwner() public {
        bytes32 id = keccak256("id2");
        address creator = address(0x1);
        address initialOwner = address(0x2);
        string memory desc = "desc";

        vm.expectRevert(abi.encodeWithSelector(Evidence.Error_CreatorIsNotInitialOwner.selector));
        deployer.createEvidence(address(deployer), id, creator, initialOwner, desc);
    }

    function testRevertIfCreatorZeroAddress() public {
        bytes32 id = keccak256("id3");
        address creator = address(0);
        address initialOwner = address(0);
        string memory desc = "desc";

        vm.expectRevert(bytes("Invalid Creator: cannot be zero address"));
        deployer.createEvidence(address(deployer), id, creator, initialOwner, desc);
    }

    function testRevertIfEvidenceIdEmpty() public {
        bytes32 id = bytes32(0);
        address creator = address(0x5);
        address initialOwner = creator;
        string memory desc = "desc";

        vm.expectRevert(bytes("Invalid evidence ID: ID cannot be empty"));
        deployer.createEvidence(address(deployer), id, creator, initialOwner, desc);
    }

    function testRevertIfDescriptionEmpty() public {
        bytes32 id = keccak256("id4");
        address creator = address(0x6);
        address initialOwner = creator;
        string memory desc = "";

        vm.expectRevert(bytes("Invalid description: description cannot be empty"));
        deployer.createEvidence(address(deployer), id, creator, initialOwner, desc);
    }

    /* ===========================
       Successful deployment & getters
       =========================== */

    function testSuccessfulDeploymentSetsImmutableAndInitialCustody() public {
        bytes32 id = keccak256("evidence-1");
        address creator = address(0xCAFE);
        address initialOwner = creator;
        string memory desc = "Important Evidence";

        vm.warp(1_700_000_000);

        Evidence ev = _deployEvidence(id, creator, initialOwner, desc);

        assertEq(ev.getEvidenceId(), id);
        assertEq(ev.getEvidenceCreator(), creator);
        assertEq(ev.getCurrentOwner(), creator);
        assertEq(ev.getEvidenceDescription(), desc);
        assertTrue(ev.getEvidenceState(), "Evidence should be active");

        uint256 toc = ev.getTimeOfCreation();
        assertEq(toc, 1_700_000_000);

        Evidence.CustodyRecord[] memory chain = ev.getChainOfCustody();
        assertEq(chain.length, 1);
        assertEq(chain[0].owner, creator);
        assertEq(chain[0].timestamp, toc);
    }

    /* ===========================
       Ownership transfer tests
       =========================== */

    function testOnlyCurrentOwnerCanTransferOwnership() public {
        bytes32 id = keccak256("evidence-transfer");
        address creator = address(0x11);
        address initialOwner = creator;
        string memory desc = "transfer test";

        Evidence ev = _deployEvidence(id, creator, initialOwner, desc);

        address notOwner = address(0x99);
        address newOwner = address(0x22);

        vm.prank(notOwner);
        vm.expectRevert(abi.encodeWithSelector(Evidence.Error_CallerIsNotCurrentOwner.selector));
        ev.transferOwnership(newOwner);

        vm.warp(1_700_100_000);
        uint256 expectedTs = block.timestamp;

        vm.prank(creator);
        vm.expectEmit(true, true, true, true);
        emit OwnershipTransferred(creator, newOwner, expectedTs);
        ev.transferOwnership(newOwner);

        assertEq(ev.getCurrentOwner(), newOwner);

        Evidence.CustodyRecord[] memory chain = ev.getChainOfCustody();
        assertEq(chain.length, 2);
        assertEq(chain[1].owner, newOwner);
    }

    /* ===========================
       Discontinuation tests
       =========================== */

    function testOnlyCreatorCanDiscontinueAndStateChanges() public {
        bytes32 id = keccak256("evidence-discontinue");
        address creator = address(0xABC);
        address initialOwner = creator;
        string memory desc = "discontinue test";

        vm.warp(1_700_000_500);
        Evidence ev = _deployEvidence(id, creator, initialOwner, desc);

        address notCreator = address(0xEEE);
        vm.prank(notCreator);
        vm.expectRevert(abi.encodeWithSelector(Evidence.Error_CallerIsNotCreator.selector));
        ev.discontinueEvidence();

        vm.warp(1_700_000_800);
        vm.prank(creator);
        vm.expectEmit(true, false, false, true);
        emit EvindenceDiscontinued(id);
        ev.discontinueEvidence();

        assertFalse(ev.getEvidenceState(), "Evidence should be inactive after discontinuation");
        uint256 tod = ev.getTimeOfDiscontinuation();
        assertEq(tod, 1_700_000_800);

        vm.prank(creator);
        vm.expectRevert(abi.encodeWithSelector(Evidence.Error_EvindenceDiscontinued.selector));
        ev.transferOwnership(address(0x123));

        vm.prank(creator);
        vm.expectRevert(abi.encodeWithSelector(Evidence.Error_EvindenceDiscontinued.selector));
        ev.discontinueEvidence();
    }

    /* ===========================
       Additional behavior tests
       =========================== */

    function testMultipleTransfersAndChainOfCustodyTimestamps() public {
        bytes32 id = keccak256("multi-transfer");
        address creator = address(0x201);
        address initialOwner = creator;
        string memory desc = "multi transfer test";

        vm.warp(1_700_001_000);
        Evidence ev = _deployEvidence(id, creator, initialOwner, desc);

        vm.warp(1_700_001_010);
        vm.prank(creator);
        ev.transferOwnership(address(0x202));

        vm.warp(1_700_001_020);
        vm.prank(address(0x202));
        ev.transferOwnership(address(0x203));

        Evidence.CustodyRecord[] memory chain = ev.getChainOfCustody();
        assertEq(chain.length, 3);
        assertEq(chain[0].owner, creator);
        assertEq(chain[1].owner, address(0x202));
        assertEq(chain[2].owner, address(0x203));
        assertEq(chain[1].timestamp, 1_700_001_010);
        assertEq(chain[2].timestamp, 1_700_001_020);
    }
}
