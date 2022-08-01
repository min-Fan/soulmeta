// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

contract a {
    IERC20Upgradeable ww;

    constructor () {
        ww = IERC20Upgradeable(0x1234567890123456789012345678901234567890);
    }

    function io () public view returns (address) {
        return address(ww);
    }
}