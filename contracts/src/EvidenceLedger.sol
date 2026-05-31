// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Evidence} from "./ChainOfCustody.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Multicall} from "@openzeppelin/contracts/utils/Multicall.sol";
import {CREATOR_ROLE, TRANSFERRER_ROLE, InvalidRole, RoleUtils} from "./lib/Roles.sol";

contract EvidenceLedger is AccessControl, Multicall {
    ////////////////////////
    // State Variables   ///
    ////////////////////////

    address private immutable EVIDENCE_GENERATOR;
    mapping(bytes32 evidenceId => address evidenceContract) private evidenceIdToEvidenceContract;
    mapping(address => uint256) private creatorToNonce;

    //////////////
    // Events  ///
    //////////////
    event EvidenceLedgerCreated(
        address indexed contractAddress,
        address indexed creator,
        uint256 indexed blockNumber,
        uint256 timeStamp,
        address evidenceGenerator
    );
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

    //////////////
    // Functions /
    //////////////
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        EVIDENCE_GENERATOR = address(new Evidence());
        emit EvidenceLedgerCreated(address(this), msg.sender, block.number, block.timestamp, EVIDENCE_GENERATOR);
    }

    function createEvidence(bytes32 metadataHash, string memory description) external onlyRole(CREATOR_ROLE) {
        uint256 nonce = ++creatorToNonce[msg.sender];
        // To Do later: Use inline assembly to reduce gas usage by encodePacked
        // Fix: remove msg.sender to generate Id to prevent duplicate metadataHash OR find a way to check it
        bytes32 evidenceId = keccak256(abi.encodePacked(msg.sender, metadataHash, block.chainid));
        require(evidenceIdToEvidenceContract[evidenceId] == address(0), "Evidence ID already exists");
        uint256 timeOfCreation = block.timestamp;
        address creator = msg.sender;
        address evidenceAddress = Clones.clone(EVIDENCE_GENERATOR);
        Evidence evidence = Evidence(evidenceAddress);
        evidence.initialize(nonce, address(this), evidenceId, creator, creator, description, timeOfCreation);

        emit EvidenceCreated(
            evidenceAddress, creator, evidenceId, address(this), timeOfCreation, metadataHash, description, nonce
        );
        _grantRole(TRANSFERRER_ROLE, creator);
        evidenceIdToEvidenceContract[evidenceId] = evidenceAddress;
    }

    function grantRoles(bytes32 role, address[] calldata _toAddresses) external onlyRole(getRoleAdmin(role)) {
        if (!RoleUtils.isValidRole(role)) revert InvalidRole(role);

        uint256 length = _toAddresses.length;
        require(length > 0, "Array cannot be empty");
        require(length <= 100, "Batch too large");

        for (uint256 i = 0; i < length;) {
            _grantRole(role, _toAddresses[i]);
            unchecked {
                ++i;
            }
        }
    }

    function revokeRoles(bytes32 role, address[] calldata _fromAddresses) external onlyRole(getRoleAdmin(role)) {
        uint256 length = _fromAddresses.length;

        require(length > 0, "Array cannot be empty");
        require(length <= 100, "Batch too large");

        for (uint256 i = 0; i < length;) {
            _revokeRole(role, _fromAddresses[i]);
            unchecked {
                ++i;
            }
        }
    }

    //getter functions
    function getEvidenceContractAddress(bytes32 evidenceId) external view returns (address evidenceContractAddress) {
        evidenceContractAddress = evidenceIdToEvidenceContract[evidenceId];
    }

    function getCreatorNonce(address creator) external view returns (uint256 nonce) {
        nonce = creatorToNonce[creator];
    }

    function getEvidenceGeneratorAddress() external view returns (address evidenceGeneratorAddress) {
        return EVIDENCE_GENERATOR;
    }
}
