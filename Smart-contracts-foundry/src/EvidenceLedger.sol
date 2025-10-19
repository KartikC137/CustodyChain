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

    Evidence private evidence;

    mapping(bytes32 evidenceId => Evidence evidence)
        private evidenceIdToEvidence;

    //////////////
    // Events  ///
    //////////////
    event EvidenceCreated(
        address indexed creator,
        bytes32 indexed evidenceId,
        string indexed description
    );

    //////////////////
    // Modifiers   ///
    //////////////////

    //////////////////
    // Functions   ///
    //////////////////

    // External Functions

    function createEvidence(
        bytes32 evidenceId,
        string memory description
    ) external {
        evidence = new Evidence(
            address(this),
            evidenceId,
            msg.sender,
            msg.sender,
            description
        );
        evidenceIdToEvidence[evidenceId] = evidence;
        emit EvidenceCreated(msg.sender, evidenceId, description);
    }

    // Public and External View Functions
    function getEvidenceLedgerStatus()
        external
        pure
        returns (bool evidenceLedgerCreated)
    {
        evidenceLedgerCreated = true;
    }

    function getEvidenceContractAddress(
        bytes32 evidenceId
    ) external view returns (address evidenceContractAddress) {
        evidenceContractAddress = address(evidenceIdToEvidence[evidenceId]);
    }
}
