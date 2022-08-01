// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

interface ISoulTimeBank {
    function stakeInfo(uint tokenId_) external view returns(uint tokenId, uint8 mode, uint amount, uint lastRewardTime, uint deadline, bool isFinished);
    function annualizedInfo(uint8 mode_) external view returns(uint period, uint rate);
    function setLastRewardTime(uint tokenId_, uint lastRewardTime_) external;
    function decrTotalRate(uint amount_) external;
    function incrPlayerRewarded(uint tokenId_, uint amount_) external;
}