// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {EvidenceLedger} from "../../src/EvidenceLedger.sol";
import {Evidence} from "../../src/ChainOfCustody.sol";
import "../../src/lib/Roles.sol";

contract ChainOfCustodyTest is Test {
    EvidenceLedger public ledger;

    // Test addresses
    address public admin;
    address public creator;
    address public newOwner;
    address public unauthorizedUser;

    // Role definitions
    bytes32 constant DEFAULT_ADMIN_ROLE = 0x00;

    // Events to test
    event EvidenceCreated(
        address indexed contractAddress,
        address indexed creator,
        bytes32 indexed evidenceId,
        address ledgerAddress,
        uint256 timeOfCreation,
        bytes32 metadataHash,
        string desc,
        uint256 nonce
    );
    event OwnershipTransferred(
        bytes32 indexed evidenceId, address indexed previousOwner, address indexed newOwner, uint256 timeOfTransfer
    );
    event EvidenceDiscontinued(
        bytes32 indexed evidenceId, address indexed caller, address indexed currentOwner, uint256 timeOfDiscontinuation
    );

    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

    function setUp() public {
        admin = address(this);
        creator = makeAddr("creator");
        newOwner = makeAddr("newOwner");
        unauthorizedUser = makeAddr("unauthorizedUser");

        ledger = new EvidenceLedger();

        // TRANSFERRER_ROLE will be granted dynamically in createEvidence()
        ledger.grantRole(CREATOR_ROLE, creator);
        ledger.grantRole(RECEIVER_ROLE, newOwner);
    }

    // ==========================================
    // LEDGER TESTS
    // ==========================================

    function test_LedgerAdminRole() public view {
        assertTrue(ledger.hasRole(DEFAULT_ADMIN_ROLE, admin));
    }

    function test_CreateEvidence_Success() public {
        bytes32 metadataHash = keccak256("Sample File Hash");
        string memory description = "Bloody Glove";

        bytes32 expectedEvidenceId = keccak256(abi.encodePacked(creator, metadataHash, block.chainid));

        // Verify creator does NOT have transferrer role yet
        assertFalse(ledger.hasRole(TRANSFERRER_ROLE, creator));

        vm.startPrank(creator);
        vm.expectEmit(false, true, true, false);

        // Note: Contract address is omitted in expectEmit as it's dynamically generated
        emit EvidenceCreated(
            address(0), creator, expectedEvidenceId, address(ledger), block.timestamp, metadataHash, description, 1
        );

        ledger.createEvidence(metadataHash, description);
        vm.stopPrank();

        // 1. Verify the clone address was saved
        address cloneAddress = ledger.getEvidenceContractAddress(expectedEvidenceId);
        assertTrue(cloneAddress != address(0));

        // 2. Verify the nonce incremented
        assertEq(ledger.getCreatorNonce(creator), 1);

        // 3. Verify TRANSFERRER_ROLE was dynamically granted
        assertTrue(ledger.hasRole(TRANSFERRER_ROLE, creator));
    }

    function test_CreateEvidence_RevertUnauthorized() public {
        bytes32 metadataHash = keccak256("Sample File Hash");

        vm.startPrank(unauthorizedUser);
        vm.expectRevert(
            abi.encodeWithSelector(AccessControlUnauthorizedAccount.selector, unauthorizedUser, CREATOR_ROLE)
        );
        ledger.createEvidence(metadataHash, "Description");
        vm.stopPrank();
    }

    // ==========================================
    // BATCH ROLE ASSIGNMENT TESTS (LEDGER)
    // ==========================================

    function test_GrantRoles_BatchSuccess() public {
        address[] memory users = new address[](3);
        users[0] = makeAddr("policeOfficer1");
        users[1] = makeAddr("policeOfficer2");
        users[2] = makeAddr("labTechnician");

        vm.prank(admin);

        ledger.grantRoles(RECEIVER_ROLE, users);

        assertTrue(ledger.hasRole(RECEIVER_ROLE, users[0]));
        assertTrue(ledger.hasRole(RECEIVER_ROLE, users[1]));
        assertTrue(ledger.hasRole(RECEIVER_ROLE, users[2]));
    }

    function test_GrantRoles_RevertUnauthorizedAccount() public {
        address[] memory users = new address[](1);
        users[0] = makeAddr("user1");

        vm.startPrank(unauthorizedUser);

        vm.expectRevert(
            abi.encodeWithSelector(AccessControlUnauthorizedAccount.selector, unauthorizedUser, DEFAULT_ADMIN_ROLE)
        );

        ledger.grantRoles(RECEIVER_ROLE, users);

        vm.stopPrank();
    }

    function test_GrantRoles_RevertEmptyArray() public {
        address[] memory users = new address[](0);

        vm.prank(admin);

        vm.expectRevert("Array cannot be empty");

        ledger.grantRoles(RECEIVER_ROLE, users);
    }

    function test_GrantRoles_RevertArrayTooLarge() public {
        address[] memory users = new address[](101);

        for (uint256 i = 0; i < 101; i++) {
            users[i] = address(uint160(i + 1));
        }

        vm.prank(admin);

        vm.expectRevert("Batch too large");

        ledger.grantRoles(RECEIVER_ROLE, users);
    }

    // ==========================================
    // EVIDENCE CLONE TESTS
    // ==========================================

    function _createEvidence() internal returns (Evidence evidenceClone, bytes32 evidenceId) {
        bytes32 metadataHash = keccak256("Test Hash");

        vm.prank(creator);
        ledger.createEvidence(metadataHash, "Weapon");

        evidenceId = keccak256(abi.encodePacked(creator, metadataHash, block.chainid));
        address cloneAddr = ledger.getEvidenceContractAddress(evidenceId);

        evidenceClone = Evidence(cloneAddr);

        console2.log("evidence status:", evidenceClone.getEvidenceState());
    }

    function test_EvidenceInitialization() public {
        (Evidence evidence, bytes32 id) = _createEvidence();

        assertEq(evidence.getEvidenceCreator(), creator);
        assertEq(evidence.getCurrentOwner(), creator);
        assertEq(evidence.getEvidenceDescription(), "Weapon");
        assertEq(evidence.getEvidenceId(), id);
        assertTrue(evidence.getEvidenceState());

        assertEq(evidence.getChainOfCustody().length, 1);
        assertEq(evidence.getChainOfCustody()[0].owner, creator);
    }

    function test_TransferOwnership_Success() public {
        (Evidence evidence, bytes32 id) = _createEvidence();

        vm.startPrank(creator);

        vm.expectEmit(true, true, true, false);
        emit OwnershipTransferred(id, creator, newOwner, block.timestamp);

        evidence.transferOwnership(newOwner);
        vm.stopPrank();

        assertEq(evidence.getCurrentOwner(), newOwner);
        assertEq(evidence.getChainOfCustody().length, 2);
        assertEq(evidence.getChainOfCustody()[1].owner, newOwner);
    }

    function test_TransferOwnership_RevertNotOwner() public {
        (Evidence evidence,) = _createEvidence();

        vm.startPrank(unauthorizedUser);
        vm.expectRevert(Evidence.Error_CallerIsNotCurrentOwner.selector);
        evidence.transferOwnership(newOwner);
        vm.stopPrank();
    }

    function test_TransferOwnership_RevertSelfTransfer() public {
        (Evidence evidence,) = _createEvidence();

        vm.startPrank(creator);
        vm.expectRevert(Evidence.Error_SelfTransferIsNotAllowed.selector);
        evidence.transferOwnership(creator);
        vm.stopPrank();
    }

    // ==========================================
    // ROLE ENFORCEMENT TESTS (EVIDENCE TRANSFER)
    // ==========================================

    function test_TransferOwnership_RevertWhenTransferrerRoleRevoked() public {
        (Evidence evidence,) = _createEvidence();

        vm.prank(admin);
        ledger.revokeRole(TRANSFERRER_ROLE, creator);

        vm.startPrank(creator);

        vm.expectRevert(Evidence.Error_SenderDoesNotHaveTransferAccess.selector);
        evidence.transferOwnership(newOwner);

        vm.stopPrank();
    }

    function test_TransferOwnership_RevertWhenReceiverLacksRole() public {
        (Evidence evidence,) = _createEvidence();

        vm.startPrank(creator);

        vm.expectRevert(Evidence.Error_SenderDoesNotHaveReceiverAccess.selector);
        evidence.transferOwnership(unauthorizedUser);

        vm.stopPrank();
    }

    function test_DiscontinueEvidence_Success() public {
        (Evidence evidence, bytes32 id) = _createEvidence();

        vm.startPrank(creator);
        vm.expectEmit(true, true, true, false);
        emit EvidenceDiscontinued(id, creator, creator, block.timestamp);
        evidence.discontinueEvidence();
        vm.stopPrank();

        assertFalse(evidence.getEvidenceState());
        assertTrue(evidence.getTimeOfDiscontinuation() > 0);
    }

    function test_DiscontinueEvidence_RevertNotCreator() public {
        (Evidence evidence,) = _createEvidence();

        vm.prank(creator);
        evidence.transferOwnership(newOwner);

        vm.startPrank(newOwner);
        vm.expectRevert(Evidence.Error_CallerIsNotCreator.selector);
        evidence.discontinueEvidence();
        vm.stopPrank();
    }

    function test_Transfer_RevertIfDiscontinued() public {
        (Evidence evidence,) = _createEvidence();

        vm.prank(creator);
        evidence.discontinueEvidence();

        vm.startPrank(creator);
        vm.expectRevert(Evidence.Error_EvidenceDiscontinued.selector);
        evidence.transferOwnership(newOwner);
        vm.stopPrank();
    }
}
