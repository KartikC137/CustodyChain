//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @title Evidence Contract for Chain of Custody
 * @author Kartik Kumbhar
 *
 * Evidence ID and Contract Address define a unique piece of evidence.
 * 1. Evidence ID is passed through EvidenceLedger contract.
 * 2. Contract Address is the address of this contract.
 *
 * @notice
 */
contract Evidence {
    //////////////////
    // Errors      ///
    //////////////////
    error Error_UnauthorizedDeployment();
    error Error_CreatorIsNotInitialOwner();
    error Error_CallerIsNotCurrentOwner();
    error Error_CallerIsNotCreator();
    error Error_EvindenceDiscontinued();

    ////////////////////////
    // State Variables   ///
    ////////////////////////
    struct CustodyRecord {
        address owner;
        uint256 timestamp;
    }

    address private immutable ORIGINAL_EVIDENCE_LEDGER_ADDRESS;
    address private immutable CREATOR;
    bytes32 private immutable EVIDENCE_ID;
    uint256 private immutable TIME_OF_CREATION;
    uint256 private TIME_OF_DISCONTINUATION;
    address private owner;
    CustodyRecord[] private chainOfCustody;
    string private description;
    bool private isActive = true;

    //////////////
    // Events  ///
    //////////////
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner, uint256 indexed timeOfTransfer);
    event EvindenceDiscontinued(bytes32 indexed evidenceId);

    //////////////////
    // Modifiers   ///
    //////////////////
    modifier onlyCreator() {
        if (msg.sender != CREATOR) revert Error_CallerIsNotCreator();
        _;
    }

    modifier onlyCurrentOwner(address caller) {
        if (caller != owner) revert Error_CallerIsNotCurrentOwner();
        _;
    }

    modifier onlyIfActive() {
        if (!isActive) revert Error_EvindenceDiscontinued();
        _;
    }

    //////////////////
    // Functions   ///
    //////////////////

    // Constructor

    constructor(
        address _evidenceLedgerAddress,
        bytes32 _evidenceId,
        address _creator,
        address _initialOwner,
        string memory _description
    ) {
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

        ORIGINAL_EVIDENCE_LEDGER_ADDRESS = _evidenceLedgerAddress;
        CREATOR = _creator;
        owner = CREATOR;
        TIME_OF_CREATION = block.timestamp;
        chainOfCustody.push(CustodyRecord({owner: _creator, timestamp: TIME_OF_CREATION}));
        EVIDENCE_ID = _evidenceId;
        description = _description;
    }

    // External Functions
    function transferOwnership(address newOwner) external onlyIfActive {
        address previousOwner = owner;
        _transferOwnership(msg.sender, newOwner);
        emit OwnershipTransferred(previousOwner, newOwner, block.timestamp);
    }

    function discontinueEvidence() external onlyIfActive {
        _discontinueEvidence();
        emit EvindenceDiscontinued(EVIDENCE_ID);
    }

    // Private & Internal Functions View function
    function _transferOwnership(address _from, address _to) private onlyCurrentOwner(_from) {
        owner = _to;
        chainOfCustody.push(CustodyRecord({owner: _to, timestamp: block.timestamp}));
    }

    function _discontinueEvidence() private onlyCreator {
        TIME_OF_DISCONTINUATION = block.timestamp;
        isActive = false;
    }

    // Public & External Functions View Functions
    function getEvidenceId() external view returns (bytes32) {
        return EVIDENCE_ID;
    }

    function getTimeOfCreation() external view returns (uint256) {
        return TIME_OF_CREATION;
    }

    function getTimeOfDiscontinuation() external view returns (uint256) {
        return TIME_OF_DISCONTINUATION;
    }

    function getEvidenceCreator() external view returns (address) {
        return CREATOR;
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
