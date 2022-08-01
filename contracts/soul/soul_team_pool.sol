// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";

import "../other/divestor_upgradeable.sol";
import "../interface/I_soul_721.sol";

contract SoulmetaTeamPool is DivestorUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IERC20MetadataUpgradeable public cUsdt;
    ISoul721 public soulFrogAddr; // 蛙NFT
    uint public groupId;
    uint[] public tokenIds; // 对应groupId下的tokenId

    // 用户数据
    struct UserInfo {
        uint accumulate; // 累计可领
    }

    // 仅结算使用
    struct Settle {
        address owner;
        uint get;
    }

    // 用户数据
    mapping(address => UserInfo) public userInfos;

    bool public isOpen;

    function initialize(address usdt_, address soulFrogAddr_, uint groupId_) public initializer {
        __Divestor_init();

        cUsdt = IERC20MetadataUpgradeable(usdt_);
        soulFrogAddr = ISoul721(soulFrogAddr_);
        groupId = groupId_;

        isOpen = true;
    }

    function setMeta(address usdt_, address soulFrogAddr_, uint groupId_, bool isOpen_) public onlyOwner {
        cUsdt = IERC20MetadataUpgradeable(usdt_);
        soulFrogAddr = ISoul721(soulFrogAddr_);
        groupId = groupId_;

        isOpen = isOpen_;
    }

    function setTokenIds(uint[] calldata tokenIds_) public onlyOwner {
        tokenIds = tokenIds_;
    }

    // 领取分红
    function getUserBonus() public {
        require(isOpen, "not open");

        bool canGet;
        uint userBalance = soulFrogAddr.balanceOf(_msgSender());
        for (uint i = 0; i < userBalance; i++) {
            if (groupId == soulFrogAddr.groupIdMap(soulFrogAddr.tokenOfOwnerByIndex(_msgSender(), i))) {
                canGet = true;
                break;
            }
        }
        require(canGet && tokenIds.length > 0, "not nft");

        uint balance = cUsdt.balanceOf(address(this));
        require(balance > 0, "not usdt");

        Settle[] memory bonusList = new Settle[](tokenIds.length);

        // 结算
        uint moneyRate = balance / tokenIds.length;
        for (uint i = 0; i < tokenIds.length; i++) {
            address owner = soulFrogAddr.ownerOf(tokenIds[i]);
            userInfos[owner].accumulate += moneyRate;
            bonusList[i] = Settle(owner, moneyRate);
        }

        for (uint i = 0; i < bonusList.length; i++) {
            cUsdt.transfer(bonusList[i].owner, bonusList[i].get);
        }
    }

    // 查询分红
    function searchUserBonus(address player_) view public returns(uint) {
        uint count;
        uint userBalance = soulFrogAddr.balanceOf(player_);
        for (uint i = 0; i < userBalance; i++) {
            if (groupId == soulFrogAddr.groupIdMap(soulFrogAddr.tokenOfOwnerByIndex(player_, i))) {
                count++;
            }
        }
        uint balance = cUsdt.balanceOf(address(this));
        uint total = tokenIds.length;
        return count <= 0 || total <= 0 || balance <= 0 ? 0 : count * balance / total;
    }
}