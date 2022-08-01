// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../other/divestor_upgradeable.sol";
import "../interface/I_soul_token.sol";

contract SoulmetaJackpot is DivestorUpgradeable {
    using SafeERC20Upgradeable for ISoulToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    ISoulToken public soul;
    IERC20Upgradeable public usdt;
    uint public jackpot;
    bool public isStart;

    mapping (address => bool) claimed;

    event Reward(address player, uint amount);

    function initialize(address usdt_, address soul_) public initializer {
        __Divestor_init();
        usdt = IERC20Upgradeable(usdt_);
        soul = ISoulToken(soul_);
    }

    function setISoul(address com_) public onlyOwner {
        soul = ISoulToken(com_);
    }

    function setIsStart(bool b_) public onlyOwner {
        isStart = b_;
    }

    function claimReward() public returns (bool){
        uint totalSupply = soul.holdTotalSupply();
        require(totalSupply <= 100000000 ether, "S: Too early.");
        uint soulB = soul.holdBalanceOf(_msgSender());

        if (jackpot == 0 && !isStart) {
            jackpot = usdt.balanceOf(address(this));
            isStart = true;
        }
        require(isStart, "S: Not start.");
        require(!claimed[_msgSender()], "S: Claimed");

        claimed[_msgSender()] = true;
        uint amount = jackpot * soulB / totalSupply;
        usdt.safeTransfer(_msgSender(), amount);
        emit Reward(_msgSender(), amount);

        return true;
    }
}