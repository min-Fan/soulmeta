// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "../other/divestor_upgradeable.sol";
import "../other/random_generator_upgradeable.sol";
import "../interface/I_soul_721.sol";
import "../interface/I_soul_token.sol";
import "../interface/I_soul_time_bank.sol";


contract SoulMetaTimeBankRate is DivestorUpgradeable, RandomGeneratorUpgradeable {
    using SafeERC20Upgradeable for IERC20MetadataUpgradeable;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    ISoulToken public soulToken;
    ISoul721 public timeBankNft;
    ISoulTimeBank public timeBank;

    mapping(address => bool) public operators;

    bool isOpen;

    modifier onlyOpen {
        require(isOpen, "Not open");
        _;
    }

    function initialize(address soulToken_, address timeBankNft_, address timeBank_) public initializer{
        __Divestor_init();
        soulToken = ISoulToken(soulToken_);
        timeBankNft = ISoul721(timeBankNft_);
        timeBank = ISoulTimeBank(timeBank_);
        isOpen = true;
    }

    function setIsOpen(bool b_) public onlyOwner {
        isOpen = b_;
    }

    function setContracts(address soulToken_, address timeBankNft_, address timeBank_) public onlyOwner{
        soulToken = ISoulToken(soulToken_);
        timeBankNft = ISoul721(timeBankNft_);
        timeBank = ISoulTimeBank(timeBank_);
    }

    function setOperator(address operator_, bool status_) public onlyOwner {
        operators[operator_] = status_;
    }


    function getReward(address caller_, uint tokenId_) public onlyOpen returns(bool){
        address user = timeBankNft.ownerOf(tokenId_);
        address player = operators[_msgSender()] ? caller_ : _msgSender();

        require(player == user, "user err");

        uint8 mode;
        uint amount;
        uint lastRewardTime;
        uint deadline;
        (, mode, amount, lastRewardTime, deadline,) = timeBank.stakeInfo(tokenId_);
        require(lastRewardTime <= deadline, "all reward released");
        uint rewardTime = block.timestamp;
        if(rewardTime > deadline){
            rewardTime = deadline;
        }

        uint period;
        uint rate;
        (period, rate) = timeBank.annualizedInfo(mode);

        uint reward = (rewardTime - lastRewardTime) * rate * amount / 1 ether;
        timeBank.setLastRewardTime(tokenId_, rewardTime);
        timeBank.decrTotalRate(reward);

        soulToken.transfer(player, reward);

        timeBank.incrPlayerRewarded(tokenId_, reward);
        return true;
    }

    function batchGetReward(address caller_, uint[] calldata tokenIds_) public onlyOpen returns (bool) {
        address player = operators[_msgSender()] ? caller_ : _msgSender();
        for (uint i = 0; i < tokenIds_.length; i++) {
            getReward(player, tokenIds_[i]);
        }
        return true;
    }


}