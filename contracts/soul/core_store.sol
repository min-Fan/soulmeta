// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import "../other/divestor_upgradeable.sol";
import "../other/random_generator_upgradeable.sol";

contract SoulmetaStore is DivestorUpgradeable, RandomGeneratorUpgradeable, ERC1155HolderUpgradeable {
    address aSoulController;

    //盲盒具体参数
    struct Box {
        uint tokenId;
        uint count;
    }

    //数据位置记录
    struct Position {
        uint poolId;     //map池子索引
        uint index;    //池子数组中数据的索引
    }

    mapping(uint => Box[]) public boxPools;    //盲盒池
    mapping(uint => Position) public positions;     //在铸造和池子维护时操作该map
    mapping(uint => uint)  public poolSizes;         //盲盒总数记录
    mapping(address => bool) public operators;

    uint[] tempIds;
    uint[] tempCounts;

    function initialize() public initializer {
        __Divestor_init();
        setOperator(owner(), true);
    }

    // ------------------------ onlyOwner start--------------------

    //将tokenId从池子中移除
    function onlyOwnerRemove(uint tokenId_) public onlyOwner {
        nftRemove(tokenId_);
    }

    function setContracts(address[] calldata addrs_) public onlyOwner {
        aSoulController = addrs_[0];
    }

    function setOperator(address operator_, bool status_) public onlyOwner {
        operators[operator_] = status_;
    }
    // ---------------------onlyOwner end--------------------
    /*
     ***** 铸造->往数组添加数据 *****
     *  @params
     *  tokenId_ ：自增id
     *  amount_ ：数量
     *  poolId_ ： 池子索引
     **/
    function createBox(uint tokenId_, uint amount_, uint poolId_) public {
        require(operators[_msgSender()], "S: Err Operator.");
        uint myPoolId = positions[tokenId_].poolId;
        if (myPoolId == 0) {
            Box memory data = Box(tokenId_, amount_);
            boxPools[poolId_].push(data);
            poolSizes[poolId_] += amount_;
            //记录数据的对应索引
            positions[tokenId_].poolId = poolId_;
            positions[tokenId_].index = boxPools[poolId_].length - 1;
        } else if (poolId_ == 0) {
            boxPools[myPoolId][positions[tokenId_].index].count += amount_;
            poolSizes[myPoolId] += amount_;
        } else {
            revert("exist Id");
        }
    }

    function createBoxBatch(uint[] calldata tokenIds_, uint[] calldata amounts_, uint poolId_) public {
        require(tokenIds_.length == amounts_.length, "invalid input");
        for (uint i = 0; i < tokenIds_.length; i++) {
            createBox(tokenIds_[i], amounts_[i], poolId_);
        }
    }

    /*
     ***** 开启->获取tokenId ****
     *  @params
     *  partIndex_ ： 池子索引前缀
     *  soulCount_ ：池子索引后缀
     **/
    function extractBox(uint poolId_) public returns (uint){
        require(operators[_msgSender()], "S: Err Operator.");

        //池子长度
        uint length = boxPools[poolId_].length;
        if (length == 0) {
            return 0;
        }

        uint index = randomCeil(length) - 1;
        //从对应池子抽中的tokenId索引

        uint tokenId = boxPools[poolId_][index].tokenId;

        _countMaintain(poolId_, index, 1);

        return tokenId;
    }

    function extractBoxBatch(uint poolId_, uint amount_) public returns (uint[] memory, uint[] memory) {
        require(operators[_msgSender()], "S: Err Operator.");

        tempIds = new uint[](0);
        tempCounts = new uint[](0);

        uint amount = amount_;
        while (amount > 0) {
            uint length = boxPools[poolId_].length;
            if (length == 0) {
                return (tempIds, tempCounts);
            }

            uint index = randomCeil(length) - 1;
            //从对应池子抽中的tokenId索引

            uint tokenId = boxPools[poolId_][index].tokenId;
            uint count = boxPools[poolId_][index].count;

            tempIds.push(tokenId);
            if (count >= amount) {
                _countMaintain(poolId_, index, amount);
                tempCounts.push(amount);
                break;
            } else {
                _countMaintain(poolId_, index, count);
                tempCounts.push(count);
                amount -= count;
            }
        }


        uint[] memory ids = tempIds;
        uint[] memory counts = tempCounts;
        delete tempIds;
        delete tempCounts;

        return (ids, counts);
    }
    /*
     *  盲盒池中的数量维护
     *  @params
     *  poolId_ :  map池子索引
     *  index_ : 数组数据索引
     **/
    function _countMaintain(uint poolId_, uint index_, uint amount_) private {
        poolSizes[poolId_] -= amount_;
        boxPools[poolId_][index_].count -= amount_;
        if (boxPools[poolId_][index_].count == 0) {
            //当前池子的该盲盒已被全部开完
            positions[boxPools[poolId_][index_].tokenId].poolId = 0;
            positions[boxPools[poolId_][index_].tokenId].index = 0;
            uint length = boxPools[poolId_].length;
            if (index_ != (length - 1) && length > 1) {
                //跟数组最后一位互换
                boxPools[poolId_][index_].tokenId = boxPools[poolId_][length - 1].tokenId;
                boxPools[poolId_][index_].count = boxPools[poolId_][length - 1].count;

                //更改记录位置,将最后一位的位置挪到当前位置
                positions[boxPools[poolId_][length - 1].tokenId].poolId = poolId_;
                positions[boxPools[poolId_][length - 1].tokenId].index = index_;
            }
            //移除该池子最后一位
            boxPools[poolId_].pop();
        }
    }



    /*
     *****  把tokenId从池子中移除  *****
     *  @params
     *  tokenId
     **/
    function nftRemove(uint tokenId_) public {
        require(operators[_msgSender()], "S: Err Operator.");
        uint poolId = positions[tokenId_].poolId;
        uint index = positions[tokenId_].index;

        uint length = boxPools[poolId].length;
        poolSizes[poolId] -= boxPools[poolId][index].count;
        boxPools[poolId][index].tokenId = boxPools[poolId][length - 1].tokenId;
        boxPools[poolId][index].count = boxPools[poolId][length - 1].count;

        positions[tokenId_].poolId = 0;
        positions[tokenId_].index = 0;
        //更改记录位置,将最后一位的位置挪到当前位置
        positions[boxPools[poolId][length - 1].tokenId].poolId = poolId;
        positions[boxPools[poolId][length - 1].tokenId].index = index;

        boxPools[poolId].pop();
    }


    /*
     *****  查询对应池子的数据  ****
     *  @params
     *  theme_ : 主题，目前只有盲盒一种，默认为：1
     *  group_ : 群体： 1-女，2-男
     *  amount_ : 铸造数量
     *  soulCount_ : 消耗soul的数量
     *
     **/
    function viewPool(uint8 theme_, uint8 group_, uint8 soulCount_) public view returns (Box[] memory){
        //组装索引
        uint poolId = (theme_ * 10000) + (group_ * 100) + soulCount_;
        //位表示， 千位起表示主题，百位，表示性别，个十位表示销毁的soul数量
        return boxPools[poolId];
    }

    function poolSizeTotal() public view returns (uint) {
        uint size;
        for (uint i = 10101; i <= 10120; i++) {
            size += poolSizes[i];
        }
        for (uint i = 10201; i <= 10220; i++) {
            size += poolSizes[i];
        }
        return size;
    }
}