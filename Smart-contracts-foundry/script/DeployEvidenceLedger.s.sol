// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {EvidenceLedger} from "../src/EvidenceLedger.sol";

contract DeployEvidenceLedger is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        EvidenceLedger evidence = new EvidenceLedger();

        // Example sample evidences
        evidence.createEvidence(
            0x0101010101010101010101010101010101010101010101010101010101010101, "Camera photo: front door"
        );

        evidence.createEvidence(
            0x1111111111111111111111111111111111111111111111111111111111111111, "Chain seal: A1234"
        );

        evidence.createEvidence(
            0x2222222222222222222222222222222222222222222222222222222222222222, "Evidence bag: blood sample"
        );

        console.log("Sample evidences created on-chain.");

        vm.stopBroadcast();
    }
}
