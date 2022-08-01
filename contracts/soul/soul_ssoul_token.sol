// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SsoulToken is ERC20, Ownable {

    constructor() ERC20("Soul Meta SSOUL Token", "SSOUL") {}

    // 增发接口
    function safeMint(address to_, uint amount_) public onlyOwner {
        _mint(to_, amount_);
    }

    // 销毁接口
    function safeBurn(uint256 amount_) public {
        _burn(_msgSender(), amount_);
    }
}
