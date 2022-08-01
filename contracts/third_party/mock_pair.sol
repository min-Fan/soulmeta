// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../other/divestor_upgradeable.sol";

contract MockPair is ERC20Upgradeable, DivestorUpgradeable {
    function initialize(string calldata name_, string calldata symbol_) public initializer {
        __ERC20_init(name_, symbol_);
        __Divestor_init();
        _mint(_msgSender(), 200 ether);
    }

    function mint(address to_, uint amount_) public onlyOwner {
        _mint(to_, amount_);
    }
}