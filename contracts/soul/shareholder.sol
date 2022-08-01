// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "../other/divestor_upgradeable.sol";

// 1、股息储备池
interface ISoulDividendPool{
    function addBonus(uint add) external;
}

contract SoulmetaShareholder is DivestorUpgradeable {
    using SafeERC20Upgradeable for IERC20MetadataUpgradeable;

    IERC20MetadataUpgradeable public cUsdt;
    bool onceFlag;
    mapping(uint => address) public targetAddrs;

    function initialize(address[] calldata addrs_) public initializer {
        __Divestor_init();
        setContracts(addrs_);
    }

    function setContracts(address[] calldata addrs_) public onlyOwner returns (bool) {
        cUsdt = IERC20MetadataUpgradeable(addrs_[0]);
        targetAddrs[0] = addrs_[1];
        targetAddrs[1] = addrs_[2];
        targetAddrs[2] = addrs_[3];
        targetAddrs[3] = addrs_[4];
        targetAddrs[4] = addrs_[5];
        targetAddrs[5] = addrs_[6];
        return true;
    }

    function divide() public returns (uint) {
        uint balance = cUsdt.balanceOf(address(this));
        cUsdt.safeTransfer(targetAddrs[0], balance * 500 / 1000);
        ISoulDividendPool(targetAddrs[0]).addBonus(balance * 500 / 1000);

        cUsdt.safeTransfer(targetAddrs[1], balance * 100 / 1000);
        cUsdt.safeTransfer(targetAddrs[2], balance * 75 / 1000);
        cUsdt.safeTransfer(targetAddrs[3], balance * 25 / 1000);
        cUsdt.safeTransfer(targetAddrs[4], balance * 250 / 1000);
        cUsdt.safeTransfer(targetAddrs[5], balance * 50 / 1000);
        return balance;
    }


}