// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "./moster_nft.sol";

contract MonsterMarket is Initializable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    MonsterNft public monster;             // monster nft 合约地址
    IERC20Upgradeable public soulToken;    // soul token 合约地址
    IERC20Upgradeable public usdt;         // usdt token 合约地址

    address public wallet;                 // 官方钱包地址
    address public soulPair;               // dodo 资金池地址

    struct RarityPrice {
        uint rarity;        // 稀有度 1 - SSR | 2 - SR | 3 - S | 4 - R | 5 - N                  
        uint price;         // 价格
    }

    mapping(uint => RarityPrice) public rarityPrice;
    
    function initialize(address wallet_, address monster_, address soul_, address usdt_, address soulPair_) public initializer {
        __Ownable_init_unchained();
        monster = MonsterNft(monster_);
        soulToken = IERC20Upgradeable(soul_);
        usdt = IERC20Upgradeable(usdt_);
        wallet = wallet_;
        soulPair = soulPair_;
    }

    // 设置定价
    function setPrice(uint id_, uint rarity_, uint price_) public onlyOwner {
        // USDT 价格 单位 ether
        rarityPrice[id_] = RarityPrice({
            rarity: rarity_,
            price: price_
        });
    }

    // 购买
    function buyMonster(uint id_, uint method_) public {
        address player = _msgSender();
        uint len = monster.getIdList(id_).length;
        require(len != 0, "buyMonster: No_such_monsters");

        uint tokenid = monster.getIdList(id_)[0];
        uint id = monster.getTokenId(tokenid);
        // 定价 - U
        uint pricing = rarityPrice[id].price;
        require(pricing != 0, "buyMonster: Not_priced");
        require(method_ == 1 || method_ == 2, "buyMonster: Wrong_payment_method");

        uint userSoulBalance = soulToken.balanceOf(player);
        uint userUsdtBalance = usdt.balanceOf(player);

        if (method_ == 1) {
            require(userUsdtBalance >= pricing, "buyMonster: Low_usdt_balance");
            // usdt 支付
            usdt.safeTransferFrom(player, wallet, pricing);
        } else if (method_ == 2) {
            // soul 支付
            // 计算 soul 价格
            uint soulPrice;
            uint soulBalance = soulToken.balanceOf(soulPair);
            uint usdtBalance = usdt.balanceOf(soulPair);
            // 汇率 SOUL / USDT
            uint ratio = soulBalance * 1 gwei / usdtBalance;
            soulPrice = ratio * pricing / 1 gwei;
            // soul - 9 折
            uint price = soulPrice * 9 / 100;
            require(userSoulBalance >= price, "buyMonster: Low_soul_balance");
            soulToken.safeTransferFrom(player, wallet, price);
        }

        // 转 NFT
        monster.transferFrom(wallet, player, tokenid);
        // 删除当前 token
        monster.delIdList(id_);

    }

}