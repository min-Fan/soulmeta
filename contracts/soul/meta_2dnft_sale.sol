// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../other/divestor_upgradeable.sol";

interface Meta2dnft {
    function tokenURI(uint tokenId_) external view returns (string memory);
    function mint(address player_) external returns (uint);
    function getTokenIdList(address addr_) external view returns (uint[] memory);
}

contract Soulmeta2dnftSale is DivestorUpgradeable {
    Meta2dnft public nft;                   // 3dnft 合约地址

    address[] public wallet;                // 钱包
    uint public freeMaxNums;                // 免费最大个数
    uint public price;                      // 价格
    bool public isOpen;                     // 开关

    mapping(address => uint) public mapWhiteToken;
    mapping(uint => uint) public mapOrders;
    mapping(address => bool) public whiteList;
    mapping(address => address) public referrers;
    mapping(address => bool) public receiveMap;

    address public soulAddr;
    event Mint(address indexed player, uint indexed orderNumber, uint indexed tokenId, bool isFree);
    event SetReferrers(address indexed player, address recommender);

    function initialize(address nft_, address[] calldata wallet_) public initializer {
        __Ownable_init_unchained();
        nft = Meta2dnft(nft_);
        freeMaxNums = 200;
        isOpen = true;
        price = 1 ether;
        wallet = wallet_;
    }

    function setMeta(bool b_, uint price_, uint maxNums_, address soulAddr_) public onlyOwner {
        isOpen = b_;
        price = price_;
        freeMaxNums = maxNums_;
        soulAddr = soulAddr_;
    }

    function setWallet(address[] calldata wallet_) public onlyOwner {
        wallet = wallet_;
    }

    function setWhiteList(address[] calldata addrs_, bool status_) public onlyOwner {
        for (uint i = 0; i < addrs_.length; i++) {
            whiteList[addrs_[i]] = status_;
        }
    }

    function tokenURI(uint tokenId_) public view returns (string memory) {
        return nft.tokenURI(tokenId_);
    }

    // 查询是否是白名单 && 是否收费
    function isWhiteList (address address_) public view returns (bool) {
        return whiteList[address_] && mapWhiteToken[address_] == 0;
    }

    // 用户铸造 NFT
    function playerMint(uint orderNumber_, address recommender_) public payable {
        require(isOpen, "Not Open");
        address player = _msgSender();
        uint tokenId = nft.mint(player);

        require(mapOrders[orderNumber_] == 0, "playerMint: Order_number_exists");

        if (freeMaxNums != 0 && isWhiteList(player)) {
            // 免费数量递减
            if (freeMaxNums != 0) {
                freeMaxNums -= 1;
            }
            // 该白名单 token
            mapWhiteToken[player] = tokenId;
            emit Mint(player, orderNumber_, tokenId, true);
        } else {
            // 付费铸造
            require(msg.value == price, "playerMint: Price_error");
            payable(wallet[0]).transfer(price * 40 / 100);
            payable(wallet[1]).transfer(price * 24 / 100);
            payable(wallet[2]).transfer(price * 16 / 100);


            if(recommender_ != address(0) || referrers[player] != address(0)){
                if(referrers[player] != address(0)){
                    recommender_ = referrers[player];
                }else{
                    referrers[player] = recommender_;
                    emit SetReferrers(player, recommender_);
                }
                payable(wallet[3]).transfer(price * 5 / 100);     //社区地址
                payable(recommender_).transfer(price * 15 / 100);
            }else{
                payable(wallet[3]).transfer(price * 5 / 100);    //社区地址
                payable(wallet[4]).transfer(price * 15 / 100);     //默认推荐人地址
            }

            emit Mint(player, orderNumber_, tokenId, false);
        }
        mapOrders[orderNumber_] = tokenId;
    }

    // 查询用户的 nft 列表
    function getTokenIdList(address addr_) public view returns (uint[] memory) {
        // 获取某个地址下的所有TokenID
        return nft.getTokenIdList(addr_);
    }

    function tokenReceive(address recommender_) public returns(bool){
        require(recommender_ != address(0), "must have a recommender");
        require(!receiveMap[_msgSender()], "received");
        if(referrers[_msgSender()] != address(0)){
            recommender_ = referrers[_msgSender()];
        }else{
            referrers[_msgSender()] = recommender_;
        }

        receiveMap[_msgSender()] = true;
        IERC20Upgradeable(soulAddr).transfer(_msgSender(), 0.01 ether);

        return true;
    }


}
