// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

interface ISoulTimeBankRate {
    function getReward(address caller_, uint tokenId_) external;
}