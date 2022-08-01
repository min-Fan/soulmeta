// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

interface Ismb {
    function balanceOf(address owner, uint256 id) external view returns (uint);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint);
}

contract SmbViewer is Ownable {
    Ismb smb;
    constructor (address smb_) {
        smb = Ismb(smb_);
    }




}
