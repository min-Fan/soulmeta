// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "../other/divestor_upgradeable.sol";
import "../other/random_generator_upgradeable.sol";
import "../interface/I_soul_1155.sol";
import "../interface/I_soul_721.sol";
import "../interface/I_soul_team.sol";
import "../interface/I_soul_token.sol";
import "../interface/I_soul_store.sol";
import "../interface/I_soul_bonus.sol";

interface IShareholder {
    function divide() external returns (uint);
}

contract SoulmetaControllerV1 is DivestorUpgradeable, RandomGeneratorUpgradeable {
    using SafeERC20Upgradeable for IERC20MetadataUpgradeable;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    IERC20MetadataUpgradeable public cUsdt;
    uint public U_ACC;
    ISoulStore public cSoulStore;
    ISoul1155 public cSoul1155;
    ISoul721 public cSoul721;
    ISoulToken public cSoulToken;
    ISoulTeam public cSoulTeam;
    address public aSoulPair;
    address public aPlatform;           //平台
    address public aJackpot;            //固定奖池
    address public aShareHolder;        //聪聪蛙股东会
    address public aReceiveAddr;        //默认推荐人
    address public aSoulAirdrop;   //soul发放地址
    bool public isOpenCast;                //是否开启铸造
    bool public isOpenExtract;                //是否开启抽取

    struct TotalAmount {
        uint recommender;        //推荐奖励
        uint community;          //社区
        uint platform;           //平台
        uint jackpot;            //固定奖池
        uint shareHolder;        //聪聪蛙股东会
        uint receiveAddr;        //默认推荐人
    }

    struct UserInfo {
        uint lastGetReferDay; // 上一次领取推荐奖励
    }

    TotalAmount public totalAmount;      //奖励统计

    CountersUpgradeable.Counter public boxCounter;

    //推荐关系
    mapping(address => address) public referrers;      //推荐人绑定
    mapping(address => address) public teams;          //团队绑定
    uint[4] referPrices;

    //钱包
    mapping(address => uint) public castWallet;       //铸造奖励
    mapping(address => uint) public referWallet;  //推荐奖励
    mapping(address => bool) public operators;

    address public aSoulMinter;
    uint public payCount;

    mapping(address => UserInfo) public userInfos;

    address public a3dnft;

    address public aSm3dPot;
    //    function initialize(address[] calldata addrs_) public initializer {
    //        __Divestor_init();
    //        setContracts(addrs_, true, true, true);
    //
    //        U_ACC = 10 ** cUsdt.decimals();
    //        referPrices = [0, U_ACC * 4 / 10, U_ACC * 3 / 10, U_ACC * 2 / 10];
    //    }


    event Cast(address indexed player, address indexed recommender, uint amount, uint poolId);
    event Extract(address indexed player, address indexed recommender, uint indexed tokenId, uint poolId);
    event Divide(address indexed player, address indexed referrer, uint8 indexed level, uint amount);
    event Reward(address indexed player, uint amount);


    // ------------------------ onlyOwner start--------------------
    //    function setOperator(address operator_, bool status_) public onlyOwner {
    //        operators[operator_] = status_;
    //    }

//    function setContracts(address[] calldata addrs_, bool status_, bool isOpenCast_, bool isOpenExtract_) public onlyOwner {
        //            cUsdt = IERC20MetadataUpgradeable(addrs_[0]);
        //            cSoulStore = ISoulStore(addrs_[1]);
        //            cSoul1155 = ISoul1155(addrs_[2]);
        //            cSoul721 = ISoul721(addrs_[3]);
        //            cSoulToken = ISoulToken(addrs_[4]);
        //            cSoulTeam = ISoulTeam(addrs_[5]);
        //            aSoulPair = addrs_[6];
        //            aPlatform = addrs_[7];
        //            aJackpot = addrs_[8];
//                    aShareHolder = addrs_[9];
        //            aReceiveAddr = addrs_[10];
        //            aSoulAirdrop = addrs_[11];
        //            aSoulMinter = addrs_[12];
        //            operators[addrs_[13]] = status_;
        //            a3dnft = addrs_[14];
//        aSm3dPot = addrs_[15];
        //            isOpenExtract = isOpenExtract_;
        //            isOpenCast = isOpenCast_;
//    }

    function _referWalletDeduct(address player, uint price) private {
        if (referWallet[player] >= price) {
            referWallet[player] -= price;
        } else {// referWallet[player] < price
            price -= referWallet[player];
            referWallet[player] = 0;
            cUsdt.safeTransferFrom(player, address(this), price);
        }
    }

    /*
     *****  铸造->前端调用api *****
     * @params
     *  theme_ : 主题，目前只有盲盒一种，默认为：1
     *  group_ : 群体： 1-女，2-男
     *  amount_ : 铸造数量
     *  soulCount_ : 消耗soul的数量
     *  recommender_ : 推荐人
     *
     **/
    function buildBox(uint8 theme_, uint8 group_, uint soulCount_, uint amount_, address recommender_) public {
        uint bCount = ISoul721(a3dnft).balanceOf(_msgSender());
        require(bCount > 0, "no have 3D nft");

        address player = _msgSender();
        require(isOpenCast, "not open");
        require(recommender_ != player, "not own addr");
        require(theme_ == 1 && (group_ == 1 || group_ == 2) && amount_ > 0, "inv param");
        require(soulCount_ <= 20 && soulCount_ % 5 == 0, "soul err");

        //用户每铸造100个需要支付4u
        _referWalletDeduct(player, amount_ * 4 * U_ACC);


        uint burn;
        uint b1 = cSoulToken.balanceOf(aSoulPair);
        uint b2 = cUsdt.balanceOf(aSoulPair) * 1 ether / U_ACC;
        if (b1 != 0 && b2 != 0) {
            uint uintPrice = (b2 * 1 gwei / b1);
            //单价
            if (soulCount_ == 0) {
                burn = 6 gwei * 1 ether / uintPrice;
            } else if (soulCount_ == 5) {
                burn = 20 gwei * 1 ether / uintPrice;
            } else if (soulCount_ == 10) {
                burn = 50 gwei * 1 ether / uintPrice;
            } else if (soulCount_ == 15) {
                burn = 60 gwei * 1 ether / uintPrice;
            } else if (soulCount_ == 20) {
                burn = 100 gwei * 1 ether / uintPrice;
            }
        } else {
            burn = 1 ether;
        }

        //
        //        uint burn = soulCount_ * 1 ether;
        //        if (soulCount_ == 0) {
        //            uint b1 = cSoulToken.balanceOf(aSoulPair);
        //            uint b2 = cUsdt.balanceOf(aSoulPair) * 1 ether / U_ACC;
        //            if (b1 != 0 && b2 != 0 && (b2 * 1 gwei / b1) > 6 gwei) {
        //                burn = 6 gwei * 1 ether / (b2 * 1 gwei / b1);
        //            } else {
        //                burn = 1 ether;
        //            }
        //        }

        //消耗soul的数量
        cSoulToken.burnFrom(player, burn);

        //触发分成规则
        _divide(player, recommender_, address(0), amount_);

        uint count = ISoul721(aSoulMinter).balanceOf(_msgSender());
        if (count > 0) soulCount_ = 45;

        //组装插入数组中的索引
        uint poolId = getPoolId(theme_, group_, uint8(soulCount_ / 5 + 1));
        //位表示， 千位起表示主题，百位，表示性别，个十位表`b   示销毁的soul数量

        //tokenId
        boxCounter.increment();
        uint tokenId = boxCounter.current();
        cSoul721.mint(player, tokenId);
        cSoul1155.mint(address(cSoulStore), tokenId, amount_ * 100);

        //调用铸造方法
        cSoulStore.createBox(tokenId, amount_ * 100, poolId);

        emit Cast(player, recommender_, amount_, poolId);
    }


    //    /*
    //   *****  开启->前端调用api  *****
    /*
     *  批量购买盲盒
     *  theme_ : 主题，目前只有盲盒一种，默认为：1
     *  group_ : 群体： 1-女，2-男
     **/
    function drawBox(address caller_, uint8 theme_, uint8 group_, uint amount_, address recommender_) public returns (bool){
        address player = operators[_msgSender()] ? caller_ : _msgSender();
        require(isOpenExtract, "not open");
        require(recommender_ != player, "not own addr");
        require(theme_ == 1 && (group_ == 1 || group_ == 2), "inv param");

        amount_ = operators[_msgSender()] ? amount_ : 1;

        //用户支付u
        _referWalletDeduct(player, amount_ * 4 * U_ACC);

        //给抽取者soul
        uint s = 1 ether;
        uint b1 = cSoulToken.balanceOf(aSoulPair);
        uint b2 = cUsdt.balanceOf(aSoulPair) * 1 ether / U_ACC;
        if (b1 != 0 && b2 != 0 && (b2 * 1 gwei / b1 >= 4.2 gwei)) {
            s = 4.2 gwei * 1 ether / (b2 * 1 gwei / b1);
        }
        cSoulToken.transfer(player, s * amount_);


        uint8 soulCount;

        //目标池子数量
        uint targetCount = _getTargetCount(amount_);

        if (payCount / 2000 != (payCount + amount_) / 2000) IShareholder(aShareHolder).divide();
        payCount += amount_;

        uint poolId;
        uint[] memory ids;
        uint[] memory counts;
        for (uint8 i = 0; i < 3; i++) {
            if (i == 0 && targetCount == 0) continue;
            if (i == 0) {
                soulCount = 10;
            } else if (i == 1) {
                soulCount = _getIndex();
            } else {
                soulCount = 1;
            }
            poolId = getPoolId(theme_, group_, soulCount);
            (ids, counts) = cSoulStore.extractBoxBatch(poolId, i == 0 ? targetCount : amount_);
            amount_ -= _extractAll(player, recommender_, ids, counts, poolId);
            if (amount_ == 0) break;
        }
        require(amount_ == 0, "quantity");
        return true;
    }

    function _extractAll(address caller_, address recommender_, uint[] memory tokenIds, uint[] memory amounts, uint poolId_) private returns (uint){
        uint rCount;
        for (uint i = 0; i < tokenIds.length; i++) {
            address caster = cSoul721.ownerOf(tokenIds[i]);
            if (caster == address(0)) {
                caster = aReceiveAddr;
            }
            _divide(caller_, recommender_, caster, amounts[i]);
            cSoul1155.safeTransferFrom(address(cSoulStore), caller_, tokenIds[i], amounts[i], '');
            rCount += amounts[i];
            emit Extract(caller_, recommender_, tokenIds[i], poolId_);
        }
        return rCount;
    }

    function getPoolId(uint8 theme_, uint8 group_, uint8 count) public pure returns (uint){
        return (theme_ * 10000) + (group_ * 100) + count;
    }


    /*
     *  获取销毁不同soul的的概率
     **/
    function _getIndex() private returns (uint8){
        //获取1-100的随机数
        uint random = randomCeil(200);
        if (random > 100) {
            return 1;
        } else if (random > 60) {
            return 5;
        } else if (random > 30) {
            return 4;
        } else if (random > 10) {
            return 3;
        } else {
            return 2;
        }
    }

    /*
     ***** 分成规则 *****
     *  @params
     *  recommender_ : 推荐人
     *  caster_ : 铸造者
     *  amount_ : 数量
     **/
    function _divide(address caller_, address recommender_, address caster_, uint amount_) private {
        address player = caller_;

        // Jackpot获得1u
        uint jackpotAdd = amount_ * U_ACC;
        totalAmount.jackpot += jackpotAdd;
        cUsdt.safeTransfer(aJackpot, jackpotAdd);

        // 平台/股东分红
        uint platformAdd;
        uint shareHolderAdd;
        // 铸造者地址为空，为铸造操作
        if (caster_ == address(0)) {
            platformAdd = amount_ * U_ACC * 8 / 10;
            shareHolderAdd = amount_ * U_ACC * 12 / 10;
        } else {// 开启操作
            //铸造者分成1u
            castWallet[caster_] += amount_ * U_ACC;

            platformAdd = amount_ * U_ACC * 2 / 10;
            shareHolderAdd = amount_ * U_ACC * 8 / 10;
        }
        totalAmount.platform += platformAdd;
        totalAmount.shareHolder += shareHolderAdd;

        cUsdt.safeTransfer(aPlatform, platformAdd);
        ISoulBonus(aPlatform).addBonus(0, platformAdd);

        cUsdt.safeTransfer(aShareHolder, shareHolderAdd);

        //没有推荐人
        /*****    推荐人判断    *****/
        //初始分成金额
        uint receiveCount = amount_ * U_ACC;

        uint referAmount;
        address team;

        if (referrers[player] == address(0)) {
            referrers[player] = recommender_;
        }

        address referrer = player;
        for (uint8 i = 0; i <= 1; i++) {
            if (i != 0) {
                referAmount = amount_ * referPrices[i];
                referWallet[referrer] += referAmount;
                receiveCount -= referAmount;
                totalAmount.recommender += referAmount;
                emit Divide(player, referrer, i, referAmount);
            }

            if (teams[player] == address(0)) {
                (team,,) = cSoulTeam.teams(referrer);
                if (team != address(0)) {
                    teams[player] = team;
                } else if (teams[referrer] != address(0)) {
                    teams[player] = teams[referrer];
                }
            }

            referrer = referrers[referrer];
            if (referrer == address(0)) break;
        }

        //新池子
        receiveCount -= 3 * amount_ * U_ACC / 10;
        cUsdt.safeTransfer(aSm3dPot, 3 * amount_ * U_ACC / 10);

        /*****    骑士判断  *****/
        // 存在骑士
        if (teams[player] != address(0)) {
            uint communityAdd = 3 * amount_ * U_ACC / 10;
            totalAmount.community += communityAdd;
            // 社区获得(amount_ * 0.1)
            cUsdt.safeTransfer(address(cSoulTeam), communityAdd);
            receiveCount -= communityAdd;
            // 初始分成金额减少
            cSoulTeam.addReward(teams[player], communityAdd);
            emit Divide(player, teams[player], 0, communityAdd);
        }

        // 把剩余的初始分成金额转入默认推荐人地址
        if (receiveCount > 0) {
            totalAmount.receiveAddr += receiveCount;
            cUsdt.safeTransfer(aReceiveAddr, receiveCount);
        }
    }


    //    /*
    //    * 用户取出金额
    //    **/
    function reward() public {
        address player = _msgSender();
        UserInfo storage userInfo = userInfos[player];
        uint day = block.timestamp / 1 days;

        uint amount = castWallet[player];
        uint referAmount = referWallet[player] / 100;

        if (day > userInfo.lastGetReferDay && referAmount > 0) {
            amount += referAmount;
            userInfo.lastGetReferDay = day;
            referWallet[player] -= referAmount;
        }
        require(amount > 0, "no credit");

        castWallet[player] = 0;

        cUsdt.safeTransfer(player, amount);
        emit Reward(player, amount);
    }

    function setReferrersFrom(address user_, address communityAddr_) public {
        require(_msgSender() == aSoulAirdrop || _msgSender() == owner(), "S: Err Operator.");
        referrers[user_] = communityAddr_;
    }
    //
    //    /*
    //     *  获取指定池子的数量
    //     **/
    function _getTargetCount(uint amount_) public view returns (uint){
        return (amount_ + payCount) / 3 - payCount / 3 + (amount_ + payCount) / 10 - payCount / 10 - ((amount_ + payCount) / 30 - payCount / 30);
    }
}