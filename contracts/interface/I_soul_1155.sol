// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

interface ISoul1155 {
    function mint(address to_, uint tokenId_, uint amount_) external returns (bool);
    function safeTransferFrom(address from, address to, uint256 cardId, uint256 amount, bytes memory data_) external;
    function burn(address account, uint256 id, uint256 value) external;
}
