// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./soul_3dnft.sol";

contract NftAdmin is Initializable, OwnableUpgradeable {

    Soulmeta3dnft public nft;             // 3dnft 合约地址
    address NFTcontract;
    address sales;                        // 销售合约地址

    modifier onlySales() {
        require(msg.sender == sales);
        _;
    }
    
    event NFTReceived( address operator, address indexed from, uint256 indexed id, bytes data);

    function initialize(address nft_) public initializer {
        __Ownable_init_unchained();
        nft = Soulmeta3dnft(nft_);
        NFTcontract = nft_;
    }

    function setSalesRole(address sales_) public onlyOwner {
        sales = sales_;
    }

    function safeSetIsOpen(bool b_) public onlyOwner {
        nft.setIsOpen(b_);
    }

    function safeSetBaseURI(string calldata uri_) public onlyOwner {
        nft.setBaseURI(uri_);
    }

    function safeSetFreeMaxNums(uint maxNums_) public onlyOwner {
        nft.setFreeMaxNums(maxNums_);
    }

    function safeSetWhiteList(address[] calldata addrs_, bool status_) public onlyOwner {
        nft.setWhiteList(addrs_, status_);
    }

    // 销售合约铸造
    function safeMint(address player_, uint tonkenid_) public onlySales {
        nft.mint();
        nft.safeTransferFrom(address(this), player_, tonkenid_);
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4) {
        require(_msgSender() == NFTcontract, "you are not NFTcontract");
        emit NFTReceived(operator, from, tokenId, data);
        return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }
}