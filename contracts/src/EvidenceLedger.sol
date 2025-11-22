// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Evidence} from "./ChainOfCustody.sol";

contract EvidenceLedger {
    //////////////////
    // Errors      ///
    //////////////////

    ////////////////////////
    // State Variables   ///
    ////////////////////////

    mapping(bytes32 evidenceId => address evidenceContract) private evidenceIdToEvidenceContract;
    mapping(address => uint256) private creatorToNonce;

    //////////////
    // Events  ///
    //////////////
    event EvidenceLedgerCreated(
        address indexed contractAddress, address indexed creator, uint256 indexed blockNumber, uint256 timeStamp
    );
    event EvidenceCreated(
        address indexed contractAddress,
        address indexed creator,
        bytes32 indexed evidenceId,
        bytes32 metadataHash,
        uint256 nonce
    );
    //////////////////
    // Modifiers   ///
    //////////////////

    //////////////////
    // Functions   ///
    //////////////////

    // Constructor
    constructor() {
        emit EvidenceLedgerCreated(address(this), msg.sender, block.number, block.timestamp);
    }

    // External Functions

    function createEvidence(bytes32 metadataHash, string memory description) external {
        uint256 nonce = ++creatorToNonce[msg.sender];
        // To Do later: Use inline assembly to reduce gas usage by encodePacked
        bytes32 evidenceId = keccak256(abi.encodePacked(msg.sender, nonce, metadataHash, block.chainid));

        Evidence evidence = new Evidence(address(this), evidenceId, msg.sender, msg.sender, description);

        require(evidenceIdToEvidenceContract[evidenceId] == address(0), "Evidence ID already exists");
        evidenceIdToEvidenceContract[evidenceId] = address(evidence);
        emit EvidenceCreated(address(evidence), msg.sender, evidenceId, metadataHash, nonce);
    }

    // Public and External View Functions
    function getEvidenceContractAddress(bytes32 evidenceId) external view returns (address evidenceContractAddress) {
        evidenceContractAddress = evidenceIdToEvidenceContract[evidenceId];
    }

    function getCreatorNonce(address creator) external view returns (uint256 nonce) {
        nonce = creatorToNonce[creator];
    }
}
