// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../interface/I_soul_token.sol";
import "./soul_3dnft.sol";
import "./soul_3dnft_admin.sol";

contract NftSales is Initializable, OwnableUpgradeable {
    using SafeERC20Upgradeable for ISoulToken;

    ISoulToken public soulToken;            // soul token 合约地址
    Soulmeta3dnft public nft;               // 3dnft 合约地址.
    NftAdmin public nftAdmin;               // 3dnft admin 合约地址.

    uint public freeMaxNums;                // 免费最大个数
    uint public handlingFee;                // 手续费
    uint public sold;                       // 计数器
    bool public isOpen;                     // 开关
    uint public token;                      // token 记录

    mapping(address => uint) public mapWhiteToken;
    mapping(uint => uint) public mapOrders;
    mapping(address => bool) public whiteList;

    event Mint(address indexed player, uint indexed orderNumber, bool isFree);
    
    function initialize(address soul_, address nft_, address admin_) public initializer {
        __Ownable_init_unchained();
        soulToken = ISoulToken(soul_);
        nft = Soulmeta3dnft(nft_);
        nftAdmin = NftAdmin(admin_);
        freeMaxNums = 200;
        handlingFee = 1 ether;
        isOpen = true;
    }

    function setIsOpen(bool b_) public onlyOwner {
        isOpen = b_;
    }

    function setFreeMaxNums(uint maxNums_) public onlyOwner {
        freeMaxNums = maxNums_;
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
    function isWhiteList (address address_) public view returns (uint) {
        if (nft.isWhiteList(address_) != 0) {
            if (whiteList[address_] && mapWhiteToken[address_] == 0) {
                return 0;
            } else {
                return handlingFee;
            }
        } else {
            return 0;
        }
    }

    // 用户铸造 NFT
    function playerMint(uint orderNumber_, uint vips_) public {
        require(isOpen, "Not Open");
        address player = _msgSender();
        token += 1;
        uint tokenId = token;

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
            uint vipPrice = vips_ * 2 ether;
            uint price = vipPrice + handlingFee;
            // 付费铸造
            soulToken.transferFrom(player, address(this), price * 5 / 100);
            soulToken.burnFrom(player, price * 95 / 100);
            emit Mint(player, orderNumber_, false);
        }
        nftAdmin.safeMint(player, tokenId);
        mapOrders[orderNumber_] = tokenId;
    }

}