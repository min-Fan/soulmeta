// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Address.sol";


contract SoulmetaToken is ERC20, Ownable {
    using Address for address;
    mapping(address => bool) public whiteList;
    bool public whiteListStatus;

    constructor () ERC20("Soul Meta Token", "SOUL") {
        _mint(_msgSender(), 1_000_000_000 ether);
        _holdBalances[_msgSender()] += 1_000_000_000 ether;
        _holdTotalSupply += 1_000_000_000 ether;
        require(totalSupply() == 1_000_000_000 ether);
    }

    function setWhiteList(address permit, bool b) public onlyOwner returns (bool) {
        whiteList[permit] = b;
        return true;
    }

    function setWhiteListStatus(bool b) public onlyOwner returns (bool) {
        whiteListStatus = b;
        return true;
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        if (whiteListStatus) {
            require(!_msgSender().isContract() || whiteList[_msgSender()]);
            require(!recipient.isContract() || whiteList[recipient]);
        }

        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        if (whiteListStatus) {
            require(!_msgSender().isContract() || whiteList[_msgSender()]);
            require(!sender.isContract() || whiteList[sender]);
            require(!recipient.isContract() || whiteList[recipient]);
        }

        _transfer(sender, recipient, amount);

        uint256 currentAllowance = allowance(sender, _msgSender());
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        _approve(sender, _msgSender(), currentAllowance - amount);

        return true;
    }

    function burn(uint256 amount) public returns (bool) {
        _burn(_msgSender(), amount);
        return true;
    }

    function burnFrom(address account, uint256 amount) public returns (bool) {
        uint256 currentAllowance = allowance(account, _msgSender());
        require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
        _approve(account, _msgSender(), currentAllowance - amount);
        _burn(account, amount);
        return true;
    }

    mapping(address => uint256) private _holdBalances;
    uint256 private _holdTotalSupply;

    function holdBalanceOf(address account) public view returns (uint256) {
        return _holdBalances[account];
    }
    function holdTotalSupply() public view returns (uint256) {
        return _holdTotalSupply;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (totalSupply() > 100_000_000 ether) {
            if (from != address(0)) {
                _holdBalances[from] -= amount;
            } else {
                _holdTotalSupply += amount;
            }
            if (to != address(0)) {
                _holdBalances[to] += amount;
            } else {
                _holdTotalSupply -= amount;
            }
        }
    }
}
