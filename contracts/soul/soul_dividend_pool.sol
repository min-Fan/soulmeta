// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";

import "../other/divestor_upgradeable.sol";
import "../interface/I_soul_721.sol";

contract SoulmetaDividendPool is ERC721Holder, DivestorUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IERC20MetadataUpgradeable public cUsdt;
    ISoul721 public soulFrogAddr; // 蛙NFT
    address public shareHolderAddr;
    uint public groupId;

    // 用户数据
    struct UserInfo {
        uint accumulate; // 累计可领
        uint cumulative; // 累计已领
        uint lastSettleMonth;

        uint[] nftIdList; // 蛙NFT
    }

    // 用户每月质押
    mapping(uint => mapping(address => uint)) public userPledgeNftCount;
    // 每月总质押
    mapping(uint => uint) public pledgeNftCount;
    // 分红池
    mapping(uint => uint) public bonusPool;
    // 总分红累计
    uint public totalBonus;
    // 用户数据
    mapping(address => UserInfo) public userInfos;
    // 利率
    mapping(uint => uint) public moneyRate;
    // 当前月
    uint public lastMonth;

    bool public isOpen;

    event PledgeNft(address indexed player, uint indexed month, uint count);
    event ReceiveNft(address indexed player, uint indexed month, uint count);
    event GetUserBonus(address indexed player, uint indexed month, uint amount);

    function initialize(address usdt_, address soulFrogAddr_, address shareHolderAddr_, uint groupId_) public initializer {
        __Divestor_init();

        cUsdt = IERC20MetadataUpgradeable(usdt_);
        soulFrogAddr = ISoul721(soulFrogAddr_);
        shareHolderAddr = shareHolderAddr_;
        groupId = groupId_;

        isOpen = true;
        lastMonth = 202206;
    }

    function setMeta(address usdt_, address soulFrogAddr_, address shareHolderAddr_, uint groupId_, bool isOpen_) public onlyOwner {
        cUsdt = IERC20MetadataUpgradeable(usdt_);
        soulFrogAddr = ISoul721(soulFrogAddr_);
        shareHolderAddr = shareHolderAddr_;
        groupId = groupId_;

        isOpen = isOpen_;

        lastMonth = 202206;
    }

    // 获取月份
    function _getMonthByTime(uint timestamp_) private pure returns (uint) {
        uint SECONDS_PER_DAY = 24 * 60 * 60;
        int OFFSET19700101 = 2440588;

        int _days = int(timestamp_ / SECONDS_PER_DAY);

        int L = _days + 68569 + OFFSET19700101;
        int N = 4 * L / 146097;
        L = L - (146097 * N + 3) / 4;
        int _year = 4000 * (L + 1) / 1461001;
        L = L - 1461 * _year / 4 + 31;
        int _month = 80 * L / 2447;
        L = _month / 11;
        _month = _month + 2 - 12 * L;
        _year = 100 * (N - 49) + _year + L;

        return uint(_year * 100 + _month);
    }

    // 获取上一个月份
    function _getPreMonthByMonth(uint month_) private pure returns (uint) {
        return month_ % 100 == 1 ? month_ - 89 : month_ - 1;
    }

    // 获取下一个月份
    function _getNextMonthByMonth(uint month_) private pure returns (uint) {
        return month_ % 100 == 12 ? month_ + 89 : month_ + 1;
    }

    // 获取下N个月份
    function _getAddMonthByMonth(uint month_, uint add_) private pure returns (uint) {
        for (uint i = 0; i < add_; i++) {
            month_ = _getNextMonthByMonth(month_);
        }
        return month_;
    }

    // 获取两个月份差值
    function _getDiffMonth(uint month1_, uint month2_) private pure returns (uint) {
        uint count;
        for (uint i = month2_; i != month1_; i = _getNextMonthByMonth(i)) {
            count++;
        }
        return count;
    }

    // 获取月份并检查更新全局数据
    function _getMonthAndUpdateGlobalData() private returns (uint) {
        uint month = _getMonthByTime(block.timestamp);

        if (lastMonth != month) {
            uint lastMonthBalance = bonusPool[_getPreMonthByMonth(lastMonth)] / 2;
            for (uint i = lastMonth; i != month; i = _getNextMonthByMonth(i)) {
                lastMonthBalance = (bonusPool[i] + lastMonthBalance) / 2;

                pledgeNftCount[i+1] += pledgeNftCount[i];
                moneyRate[i] = pledgeNftCount[i] > 0 ? lastMonthBalance / pledgeNftCount[i] : 0;

            }
            lastMonth = month;
        }
        return month;
    }

    // 获取月份并检查更新数据
    function _getMonth() private returns (uint) {
        uint month = _getMonthAndUpdateGlobalData();

        UserInfo storage userInfo = userInfos[_msgSender()];
        if (userInfo.lastSettleMonth == 0) {
            userInfo.lastSettleMonth = month;
        }

        if (userInfo.lastSettleMonth != month) {
            for (uint i = userInfo.lastSettleMonth; i != month; i = _getNextMonthByMonth(i)) {
                userPledgeNftCount[i+1][_msgSender()] += userPledgeNftCount[i][_msgSender()];
            }
            _settleDay(userInfo.lastSettleMonth, month);
            userInfo.lastSettleMonth = month;
        }

        return month;
    }

    // 用户结算
    function _settleDay(uint from_, uint to_) private {
        uint notGet;
        for (uint i = from_; i != to_; i = _getNextMonthByMonth(i)) {
            notGet += userPledgeNftCount[i][_msgSender()] * moneyRate[i];
        }
        userInfos[_msgSender()].accumulate += notGet;
    }

    function addBonus(uint add_) public {
        require(_msgSender() == shareHolderAddr || _msgSender() == owner(), "owner err");
        if (add_ > 0) {
            bonusPool[_getMonthAndUpdateGlobalData()] += add_;
            totalBonus += add_;
        }
    }

    // 质押nft
    function pledgeNft(uint[] calldata tokenIds_) public {
        require(isOpen, "not open");
        bool flag;
        for (uint i = 0; i < tokenIds_.length; i++) {
            if (groupId != soulFrogAddr.groupIdMap(tokenIds_[i])) {
                flag = true;
                break;
            }
        }
        require(!flag, "error groupId");

        uint month = _getMonth();
        pledgeNftCount[month] += tokenIds_.length;
        userPledgeNftCount[month][_msgSender()] += tokenIds_.length;

        for (uint i = 0; i < tokenIds_.length; i++) {
            userInfos[_msgSender()].nftIdList.push(tokenIds_[i]);
            soulFrogAddr.safeTransferFrom(_msgSender(), address(this), tokenIds_[i]);
        }

        emit PledgeNft(_msgSender(), month, tokenIds_.length);
    }

    // 取回nft
    function receiveNft() public {
        require(isOpen, "not open");

        uint month = _getMonth();
        uint[] memory tokenIds = userInfos[_msgSender()].nftIdList;
        require(tokenIds.length > 0, "not nft");

        pledgeNftCount[month] -= tokenIds.length;
        userPledgeNftCount[month][_msgSender()] = 0;
        delete userInfos[_msgSender()].nftIdList;

        for (uint i = 0; i < tokenIds.length; i++) {
            soulFrogAddr.safeTransferFrom(address(this), _msgSender(), tokenIds[i]);
        }

        emit ReceiveNft(_msgSender(), month, tokenIds.length);
    }

    // 领取分红
    function getUserBonus() public {
        require(isOpen, "not open");

        uint month = _getMonth();

        UserInfo storage userInfo = userInfos[_msgSender()];
        uint accumulate = userInfo.accumulate - userInfo.cumulative;

        require(accumulate > 0, "not coin err");

        userInfo.cumulative = userInfo.accumulate;
        cUsdt.transfer(_msgSender(), accumulate);

        emit GetUserBonus(_msgSender(), month, accumulate);
    }

    function searchUserNftIdList(address player_) view public returns(uint[] memory) {
        return userInfos[player_].nftIdList;
    }

    // 查询分红
    function searchUserBonus(address player_) view public returns(uint) {
        UserInfo memory userinfo = userInfos[player_];
        uint lastSettleMonth = userinfo.lastSettleMonth;

        if (lastSettleMonth == 0) {
            return 0;
        }

        uint month = _getMonthByTime(block.timestamp);
        uint nextMonth = _getNextMonthByMonth(month);

        uint count = _getDiffMonth(nextMonth, lastSettleMonth);

        uint[] memory tempMoneyRate = new uint[](count);
        uint[] memory tempPledgeNftCount = new uint[](count);

        for (uint i = 0; i < count; i++) {
            tempPledgeNftCount[i] = pledgeNftCount[_getAddMonthByMonth(lastSettleMonth, i)];
            tempMoneyRate[i] = moneyRate[_getAddMonthByMonth(lastSettleMonth, i)];
        }

        uint index = _getDiffMonth(lastMonth, lastSettleMonth);
        uint lastMonthBalance = bonusPool[_getPreMonthByMonth(_getAddMonthByMonth(lastSettleMonth, index))] / 2;
        for (uint i = index; i < count - 1; i++) {
            lastMonthBalance = (bonusPool[_getAddMonthByMonth(lastSettleMonth, i)] + lastMonthBalance) / 2;
            tempPledgeNftCount[i+1] = tempPledgeNftCount[i];
            tempMoneyRate[i] = tempPledgeNftCount[i] > 0 ? lastMonthBalance / tempPledgeNftCount[i] : 0;
        }

        uint notGet;
        for (uint i = 0; i < count; i++) {
            notGet +=  userPledgeNftCount[lastSettleMonth][player_] * tempMoneyRate[i];
        }
        return userinfo.accumulate - userinfo.cumulative + notGet;
    }
}