// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

interface ISoulTeam {
    function teams(address input) external view returns(address leader, uint totalReward, uint rewarded);
    function addReward(address leader_, uint amount_) external;
}
