// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

interface ISoulRouter {
    function payCountRecord(uint time) external view returns(uint);
}
