// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

interface ISoulStore {
    function createBox(uint tokenId, uint amount_, uint boxIndex) external;
    function extractBox(uint boxIndex) external returns(uint);
    function nftRemove(uint tokenId_) external;
    function setTeamsFrom(address user_, address communityAddr_) external;
    function referrers(address input) external view returns(address referAddr);
    function setReferrersFrom(address user_, address communityAddr_) external;
    function extractBoxBatch(uint poolId_, uint amount_) external returns (uint[] memory tokenIds, uint[] memory amounts);
}
