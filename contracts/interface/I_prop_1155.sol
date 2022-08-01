// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

interface IProp1155 {
    function mint(address to_, uint tokenId_, uint amount_) external returns (bool);
    function safeTransferFrom(address from, address to, uint256 cardId, uint256 amount, bytes memory data_) external;
    function balanceOf(address account_, uint id_) external view returns(uint256);
    function burn(address account, uint256 id, uint256 value) external;
}
