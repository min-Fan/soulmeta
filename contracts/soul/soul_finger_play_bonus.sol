// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";

import "../other/divestor_upgradeable.sol";
import "../interface/I_soul_721.sol";
import "../interface/I_soul_token.sol";

contract SoulmetaFingerPlayBonus is ERC721Holder, DivestorUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    uint DAY;

    ISoulToken public soulTokenAddr; // soul
    address public soulFingerPlayAddr; // 猜拳
    ISoul721 public soulFishPondAddr; // 鱼塘NFT

    // 用户数据
    struct UserInfo {
        uint nft;

        uint accumulate; // 累计可领
        uint cumulative; // 累计已领

        uint lastSettleDay;
    }

    // 每日数据
    struct Pledge {
        uint nft;
    }

    // 用户每日质押量
    mapping(uint => mapping(address => Pledge)) public userPledge;
    // 每日质押总量
    mapping(uint => Pledge) public totalPledge;
    // 分红池
    mapping(uint => uint) public bonusPool;
    // 总奖金
    uint public totalBonus;
    // 用户数据
    mapping(address => UserInfo) public userInfos;
    // 利率
    mapping(uint => uint) public moneyRate;

    uint public lastSettleDay;
    bool public isOpen;

    function initialize(address soulTokenAddr_, address soulFingerPlayAddr_, address soulFishPondAddr_) public initializer {
        __Divestor_init();

        soulTokenAddr = ISoulToken(soulTokenAddr_);
        soulFingerPlayAddr = soulFingerPlayAddr_;
        soulFishPondAddr = ISoul721(soulFishPondAddr_);

        DAY = 1 days;

        lastSettleDay = 19156;
    }

    function setMeta(address soulTokenAddr_, address soulFingerPlayAddr_, address soulFishPondAddr_, bool isOpen_) public onlyOwner {
        soulTokenAddr = ISoulToken(soulTokenAddr_);
        soulFingerPlayAddr = soulFingerPlayAddr_;
        soulFishPondAddr = ISoul721(soulFishPondAddr_);

        isOpen = isOpen_;
    }

    // 获取当前天
    function _getSameDay() private returns (uint) {
        uint tempQuotient = block.timestamp / DAY;

        if (lastSettleDay != tempQuotient) {
            for (uint i = lastSettleDay; i < tempQuotient; i++) {
                totalPledge[i+1].nft += totalPledge[i].nft;
                moneyRate[i] = totalPledge[i].nft > 0 ? bonusPool[i] / totalPledge[i].nft : 0;
            }
            lastSettleDay = tempQuotient;
        }

        UserInfo storage userInfo = userInfos[_msgSender()];
        if (userInfo.lastSettleDay == 0) {
            userInfo.lastSettleDay = tempQuotient;
        }

        if (userInfo.lastSettleDay != tempQuotient) {
            for (uint i = userInfo.lastSettleDay; i < tempQuotient; i++) {
                userPledge[i+1][_msgSender()].nft += userPledge[i][_msgSender()].nft;
            }
            _settleDay(userInfo.lastSettleDay, tempQuotient);
            userInfo.lastSettleDay = tempQuotient;
        }

        return tempQuotient;
    }

    function _settleDay(uint from_, uint to_) private {
        uint notGet;
        for (uint i = from_; i < to_; i++) {
            notGet += moneyRate[i] > 0 ? userPledge[i][_msgSender()].nft * moneyRate[i] : 0;
        }
        userInfos[_msgSender()].accumulate += notGet;
    }

    // soul进入记录
    function addBonus(uint add_) public {
        require(_msgSender() == soulFingerPlayAddr || _msgSender() == owner(), "owner err");
        // require(add_ > 0, "inv param");
        if (add_ > 0) {
            bonusPool[block.timestamp / DAY] += add_;
            totalBonus += add_;
        }
    }

    // 质押nft
    function pledgeNft(uint[] calldata tokenIds) public {
        require(isOpen, "not open");

        uint sameDay = _getSameDay();
        userPledge[sameDay][_msgSender()].nft += tokenIds.length;
        totalPledge[sameDay].nft += tokenIds.length;
        userInfos[_msgSender()].nft += tokenIds.length;

        for (uint i = 0; i < tokenIds.length; i ++) {
            soulFishPondAddr.safeTransferFrom(_msgSender(), address(this), tokenIds[i]);
        }
    }

    // 取回nft
    function receiveNft() public {
        require(isOpen, "not open");

        uint sameDay = _getSameDay();
        uint nftCount = userInfos[_msgSender()].nft;
        require(nftCount > 0, "not nft");

        userInfos[_msgSender()].nft = 0;
        userPledge[sameDay][_msgSender()].nft = 0;
        totalPledge[sameDay].nft -= nftCount;

        uint count = soulFishPondAddr.balanceOf(address(this));
        for (uint i = 0; i < nftCount; i++) {
            uint id = soulFishPondAddr.tokenOfOwnerByIndex(address(this), count - 1 - i);
            soulFishPondAddr.safeTransferFrom(address(this), _msgSender(), id);
        }
    }

    // 领取分红
    function getUserBonusApi() public {
        require(isOpen, "not open");

        _getSameDay();

        UserInfo storage userInfo = userInfos[_msgSender()];
        uint accumulate = userInfo.accumulate - userInfo.cumulative;

        require(accumulate > 0, "not coin err");

        userInfo.cumulative = userInfo.accumulate;
        soulTokenAddr.transfer(_msgSender(), accumulate);
    }

    // 查询分红
    function searchUserBonus(address player_) view public returns(uint) {
        UserInfo memory userinfo = userInfos[player_];
        uint lastSettleDay_ = userinfo.lastSettleDay;

        if (lastSettleDay_ == 0) {
            return 0;
        }

        uint tempQuotient = block.timestamp / DAY;

        uint count = tempQuotient - lastSettleDay_ + 1;
        uint[] memory tempMoneyRate = new uint[](count);
        Pledge[] memory tempTotalPledge = new Pledge[](count);

        for (uint i = 0; i < count; i++) {
            tempTotalPledge[i] = totalPledge[i+lastSettleDay_];
            tempMoneyRate[i] = moneyRate[i+lastSettleDay_];
        }

        for (uint i = lastSettleDay - lastSettleDay_; i < count - 1; i++) {
            tempTotalPledge[i+1] = tempTotalPledge[i];
            tempMoneyRate[i] = tempTotalPledge[i].nft > 0 ? bonusPool[i+lastSettleDay_] / tempTotalPledge[i].nft : 0;
        }

        uint notGet;
        for (uint i = 0; i < count; i++) {
            notGet += tempMoneyRate[i] > 0 ? userPledge[lastSettleDay_][player_].nft * tempMoneyRate[i] : 0;
        }
        return userinfo.accumulate - userinfo.cumulative + notGet;
    }

/////////////////////////////////////////////////////// 测试代码 ///////////////////////////////////////////////////////

    // function setUserData(address player, uint nft, uint accumulate, uint cumulative, uint lastSettleDay_) public onlyOwner {
    //     UserInfo storage userInfo = userInfos[player];
    //     userInfo.nft = nft;
    //     userInfo.accumulate = accumulate;
    //     userInfo.cumulative = cumulative;
    //     userInfo.lastSettleDay = lastSettleDay_;
    // }
    // function setUserDayData(uint day, address player, uint nft) public onlyOwner {
    //     userPledge[day][player].nft = nft;
    // }

    // function setTotalDayData(uint day, uint nft) public onlyOwner {
    //     totalPledge[day].nft = nft;
    // }

    // function setBonusPool(uint day, uint count) public onlyOwner {
    //     bonusPool[day] = count;
    // }

    // function setMoneyRate(uint day, uint count) public onlyOwner {
    //     moneyRate[day] = count;
    // }

    // function setLastSettleDay(uint day) public onlyOwner {
    //     lastSettleDay = day;
    // }

/////////////////////////////////////////////////////// 测试代码 ///////////////////////////////////////////////////////
}