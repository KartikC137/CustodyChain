//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @title Evidence Contract for Chain of Custody
 * @author Kartik Kumbhar
 * This contract is the skeleton for deploying evidence contracts.
 * Evidence ID and Contract Address define a unique piece of evidence.
 * 1. Evidence ID is passed through EvidenceLedger contract.
 * 2. Contract Address is the address of this contract.
 *
 * @notice
 */
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {TRANSFERRER_ROLE, RECEIVER_ROLE} from "./lib/Roles.sol";

contract Evidence is Initializable {
    //////////////////
    // Errors      ///
    //////////////////
    error Error_UnauthorizedDeployment();
    error Error_CreatorIsNotInitialOwner();
    error Error_CallerIsNotCurrentOwner();
    error Error_SelfTransferIsNotAllowed();
    error Error_SenderDoesNotHaveTransferAccess();
    error Error_SenderDoesNotHaveReceiverAccess();
    error Error_CallerIsNotCreator();
    error Error_EvidenceDiscontinued();

    ////////////////////////
    // State Variables   ///
    ////////////////////////
    struct CustodyRecord {
        address owner;
        uint256 timestamp;
    }

    IAccessControl private accessManager;
    uint256 private nonce;
    address private creator;
    bytes32 private id;
    uint256 private timeOfCreation;
    uint256 private timeOfDiscontinuation;
    address private owner;
    CustodyRecord[] private chainOfCustody;
    string private description;
    bool private isActive;

    //////////////
    // Events  ///
    //////////////
    event OwnershipTransferred(
        bytes32 indexed evidenceId, address indexed previousOwner, address indexed newOwner, uint256 timeOfTransfer
    );
    event EvidenceDiscontinued(
        bytes32 indexed evidenceId, address indexed caller, address indexed currentOwner, uint256 timeOfDiscontinuation
    );

    //////////////////
    // Modifiers   ///
    //////////////////
    modifier onlyCreator() {
        if (msg.sender != creator) revert Error_CallerIsNotCreator();
        _;
    }

    modifier onlyCurrentOwner(address caller) {
        if (caller != owner) revert Error_CallerIsNotCurrentOwner();
        _;
    }

    modifier onlyIfActive() {
        if (!isActive) revert Error_EvidenceDiscontinued();
        _;
    }

    //////////////////
    // Functions   ///
    //////////////////

    /**
     * @param _nonce :
     */
    function initialize(
        uint256 _nonce,
        address _evidenceLedgerAddress,
        bytes32 _evidenceId,
        address _creator,
        address _initialOwner,
        string memory _description,
        uint256 _timeOfCreation
    ) external initializer {
        require(_nonce > 0, "Invalid Nonce. Should be greater than 0.");
        if (msg.sender != _evidenceLedgerAddress) {
            revert Error_UnauthorizedDeployment();
        }
        if (_initialOwner != _creator) revert Error_CreatorIsNotInitialOwner();
        if (_creator == address(0)) {
            revert("Invalid Creator: cannot be zero address");
        }
        if (_evidenceId == 0x0) {
            revert("Invalid evidence ID: ID cannot be empty");
        }
        if (bytes(_description).length == 0) {
            revert("Invalid description: description cannot be empty");
        }

        isActive = true;
        accessManager = IAccessControl(_evidenceLedgerAddress);
        nonce = _nonce;
        creator = _creator;
        owner = creator;
        timeOfCreation = _timeOfCreation;
        chainOfCustody.push(CustodyRecord({owner: _creator, timestamp: timeOfCreation}));
        id = _evidenceId;
        description = _description;
    }

    function transferOwnership(address newOwner) external onlyIfActive onlyCurrentOwner(msg.sender) {
        if (msg.sender == newOwner) revert Error_SelfTransferIsNotAllowed();
        if (!accessManager.hasRole(TRANSFERRER_ROLE, msg.sender)) revert Error_SenderDoesNotHaveTransferAccess();
        if (!accessManager.hasRole(RECEIVER_ROLE, newOwner)) revert Error_SenderDoesNotHaveReceiverAccess();

        emit OwnershipTransferred(id, msg.sender, newOwner, block.timestamp);

        _transferOwnership(newOwner);
    }

    function discontinueEvidence() external onlyIfActive onlyCreator {
        emit EvidenceDiscontinued(id, msg.sender, owner, block.timestamp);

        _discontinueEvidence();
    }

    // Private & Internal Functions View function
    function _transferOwnership(address _to) private {
        owner = _to;
        chainOfCustody.push(CustodyRecord({owner: _to, timestamp: block.timestamp}));
    }

    function _discontinueEvidence() private {
        timeOfDiscontinuation = block.timestamp;
        isActive = false;
    }

    // Public & External Functions View Functions
    function getNonce() external view returns (uint256) {
        return nonce;
    }

    function getEvidenceId() external view returns (bytes32) {
        return id;
    }

    function getTimeOfCreation() external view returns (uint256) {
        return timeOfCreation;
    }

    function getTimeOfDiscontinuation() external view returns (uint256) {
        return timeOfDiscontinuation;
    }

    function getEvidenceCreator() external view returns (address) {
        return creator;
    }

    function getEvidenceDescription() external view returns (string memory) {
        return description;
    }

    function getCurrentOwner() external view returns (address) {
        return owner;
    }

    function getChainOfCustody() external view returns (CustodyRecord[] memory) {
        return chainOfCustody;
    }

    function getEvidenceState() external view returns (bool) {
        return isActive;
    }
}
