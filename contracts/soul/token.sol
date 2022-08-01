// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ShareCookie is ERC20 {
    constructor (address man) ERC20("Share Cookie", "SCC") {
        _mint(man, 1_000_000_000 ether);
    }

    function burnFrom(address account, uint256 amount) public returns (bool) {
        uint256 currentAllowance = allowance(account, _msgSender());
        require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
        _approve(account, _msgSender(), currentAllowance - amount);
        _burn(account, amount);
        return true;
    }

    function burn(uint256 amount) public returns (bool) {
        _burn(_msgSender(), amount);
        return true;
    }
}
