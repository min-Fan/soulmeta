// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interface/I_soul_token.sol";
import "../other/divestor.sol";

contract Soulmeta3dnft is Divestor, ERC721Enumerable {
    using Strings for uint;
    using SafeERC20 for ISoulToken;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    ISoulToken public soulToken;                // soul token 合约地址
    string public baseURI;                  // 资源根路径
    uint public freeMaxNums;                // 免费最大个数
    uint public handlingFee;                // 手续费
    uint public sold;                       // 计数器
    bool public isOpen;

    mapping(address => uint) public mapWhiteToken;
    mapping(uint => uint) public mapOrders;
    mapping(address => bool) public whiteList;

    event Mint(address indexed player, uint indexed orderNumber, bool isFree);

    constructor (address soul_) ERC721("Soul Meta 3D NFT", "SM3D") {
        soulToken = ISoulToken(soul_);
        baseURI = "https://soulmeta.io/nft-info/sm3d/";
        freeMaxNums = 200;
        handlingFee = 1 ether;
        isOpen = true;
    }

    function setIsOpen(bool b_) public onlyOwner {
        isOpen = b_;
    }

    function setBaseURI(string calldata uri_) public onlyOwner {
        baseURI = uri_;
    }

    function tokenURI(uint tokenId_) override public view returns (string memory) {
        return string(abi.encodePacked(baseURI, tokenId_.toString()));
    }


    function setFreeMaxNums(uint maxNums_) public onlyOwner {
        freeMaxNums = maxNums_;
    }

    function setWhiteList(address[] calldata addrs_, bool status_) public onlyOwner {
        for (uint i = 0; i < addrs_.length; i++) {
            whiteList[addrs_[i]] = status_;
        }
    }

    // 管理员铸造
    function mint() public onlyOwner {
        _tokenIdCounter.increment();
        uint tokenId = _tokenIdCounter.current();
        _safeMint(_msgSender(), tokenId);
    }

    // 用户铸造 NFT
    function playerMint(uint orderNumber_) public {
        require(isOpen, "Not Open");
        address player = _msgSender();
        _tokenIdCounter.increment();
        uint tokenId = _tokenIdCounter.current();

        require(mapOrders[orderNumber_] == 0, "playerMint: Order_number_exists");

        if (freeMaxNums != 0 && isWhiteList(player) == 0) {
            // 免费数量递减
            if (freeMaxNums != 0) {
                freeMaxNums -= 1;
            }
            // 该白名单 token
            mapWhiteToken[player] = tokenId;
            emit Mint(player, orderNumber_, true);
        } else {
            // 计数器到 10 增加手续费
            if (sold % 10 == 0 && sold != 0) {
                handlingFee += 1 ether;
            }
            // 计数器递增
            sold += 1;
            // 付费铸造
            soulToken.safeTransferFrom(player, address(this), handlingFee * 5 / 100);
            soulToken.burnFrom(player, handlingFee * 95 / 100);
            emit Mint(player, orderNumber_, false);
        }
        _safeMint(player, tokenId);
        mapOrders[orderNumber_] = tokenId;
    }

    // 查询是否是白名单 && 是否收费
    function isWhiteList (address address_) public view returns (uint) {
        if (whiteList[address_] && mapWhiteToken[address_] == 0) {
            return 0;
        } else {
            return handlingFee;
        }
    }

    // 查询用户订单号 tokenId
    function getOrderToken(uint orderNumber_) public view returns (uint) {
        return mapOrders[orderNumber_];
    }

    // 查询用户的 nft 列表
    function getTokenIdList(address addr_) public view returns (uint[] memory){
        // 获取某个地址下的所有TokenID
        uint index = balanceOf(addr_);
        uint[] memory tokenIds = new uint[](index);

        for (uint i = 0; i < index; ++i) {
            tokenIds[i] = tokenOfOwnerByIndex(addr_, i);
        }
        return tokenIds;
    }
}