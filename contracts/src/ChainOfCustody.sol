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
    error Error_SelfTransferIsNotAllowed();
    error Error_CallerIsNotCreator();
    error Error_EvindenceDiscontinued();

    ////////////////////////
    // State Variables   ///
    ////////////////////////
    struct CustodyRecord {
        address owner;
        uint256 timestamp;
    }

    uint256 private immutable NONCE;
    address private immutable ORIGINAL_EVIDENCE_LEDGER_ADDRESS;
    address private immutable CREATOR;
    bytes32 private immutable EVIDENCE_ID;
    uint256 private immutable TIME_OF_CREATION;
    uint256 private timeOfDiscontinuation;
    address private owner;
    CustodyRecord[] private chainOfCustody;
    string private description;
    bool private isActive = true;

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
        uint256 _nonce,
        address _evidenceLedgerAddress,
        bytes32 _evidenceId,
        address _creator,
        address _initialOwner,
        string memory _description,
        uint256 _timeOfCreation
    ) {
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

        NONCE = _nonce;
        ORIGINAL_EVIDENCE_LEDGER_ADDRESS = _evidenceLedgerAddress;
        CREATOR = _creator;
        owner = CREATOR;
        TIME_OF_CREATION = _timeOfCreation;
        chainOfCustody.push(CustodyRecord({owner: _creator, timestamp: TIME_OF_CREATION}));
        EVIDENCE_ID = _evidenceId;
        description = _description;
    }

    // External Functions
    function transferOwnership(address newOwner) external onlyIfActive {
        if (msg.sender == newOwner) revert Error_SelfTransferIsNotAllowed();
        _transferOwnership(msg.sender, newOwner);
        emit OwnershipTransferred(EVIDENCE_ID, msg.sender, owner, block.timestamp);
    }

    function discontinueEvidence() external onlyIfActive {
        _discontinueEvidence();
        emit EvidenceDiscontinued(EVIDENCE_ID, msg.sender, owner, block.timestamp);
    }

    // Private & Internal Functions View function
    function _transferOwnership(address _from, address _to) private onlyCurrentOwner(_from) {
        owner = _to;
        chainOfCustody.push(CustodyRecord({owner: _to, timestamp: block.timestamp}));
    }

    function _discontinueEvidence() private onlyCreator {
        timeOfDiscontinuation = block.timestamp;
        isActive = false;
    }

    //to wrap evidence info in one object
    // Public & External Functions View Functions
    function getNonce() external view returns (uint256) {
        return NONCE;
    }

    function getEvidenceId() external view returns (bytes32) {
        return EVIDENCE_ID;
    }

    function getTimeOfCreation() external view returns (uint256) {
        return TIME_OF_CREATION;
    }

    function getTimeOfDiscontinuation() external view returns (uint256) {
        return timeOfDiscontinuation;
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
