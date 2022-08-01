// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

interface ISoul721{
    function mint(address player_, uint tokenId_) external returns (bool);
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address account_) external view returns(uint256);
    function tokenOfOwnerByIndex(address account_, uint index_) external view returns(uint256);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function totalSupply() external view returns (uint256);
    function tokenByIndex(uint256 index) external view returns (uint256);
    function groupIdMap(uint256 index) external view returns (uint256);
    function groupInfos(uint256 index) external view returns (uint256, uint256, uint256, uint256);
}