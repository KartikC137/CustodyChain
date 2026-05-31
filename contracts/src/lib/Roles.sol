//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

bytes32 constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
bytes32 constant TRANSFERRER_ROLE = keccak256("TRANSFERRER_ROLE");
bytes32 constant RECEIVER_ROLE = keccak256("RECEIVER_ROLE");

error InvalidRole(bytes32 role);

library RoleUtils {
    function isValidRole(bytes32 role) internal pure returns (bool) {
        return role == CREATOR_ROLE || role == TRANSFERRER_ROLE || role == RECEIVER_ROLE;
    }
}
