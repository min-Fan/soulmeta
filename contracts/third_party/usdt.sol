// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract EvilUSDT is ERC20, Ownable {
    constructor () ERC20("Evil 13 USD", "USDT") {
        _mint(_msgSender(), 1_000_000 ether);
        require(totalSupply() == 1_000_000 ether);
    }

    function decimals() public pure override returns (uint8) {
        return 13;
    }

    function mint(uint256 amount) public onlyOwner returns (bool) {
        _mint(_msgSender(), amount);
        return true;
    }
}
