// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../other/divestor_upgradeable.sol";

contract SoulmetaTeamNFT is DivestorUpgradeable, ERC721EnumerableUpgradeable{
    using StringsUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    string public baseURI;
    function setBaseURI(string calldata uri_) public onlyOwner {
        baseURI = uri_;
    }
    function tokenURI(uint256 tokenId_) override public view returns (string memory) {
        return string(abi.encodePacked(baseURI, tokenId_.toString()));
    }

    CountersUpgradeable.Counter private _tokenId;

    struct Meta {
        IERC20Upgradeable usdt;
        address core;
    }
    Meta public meta;

    struct Team {
        address leader;
        uint totalReward;
        uint rewarded;
        uint[5] member;
    }
    mapping (address => Team) public teams;
    mapping (uint => address) public leaders;

    address[] teamList;

    event NewTeam(address indexed leader_);

    function initialize(string memory name_, string memory symbol_, string memory baseURI_)  public initializer{
        __Divestor_init();
        __ERC721_init(name_, symbol_);
        baseURI = baseURI_;
    }

    function setMeta (address usdt_, address core_) public onlyOwner returns (bool) {
        meta.usdt = IERC20Upgradeable(usdt_);
        meta.core = core_;
        return true;
    }

    function newTeamBatch(address[] calldata leaders_, uint toMeCount_, address[] calldata mes_) public onlyOwner returns (bool) {
        for (uint i = 0; i < leaders_.length; i++) {
            newTeam(leaders_[i], toMeCount_, mes_[i]);
        }
        return true;
    }

    function newTeam(address leader_, uint toMeCount_, address me_) public onlyOwner returns (bool) {
        require(teams[leader_].leader == address(0), "S: Leader Exist.");
        address me = me_ == address(0) ? _msgSender() : me_;

        uint[5] memory member;
        uint count = toMeCount_;
        for (uint i = 0; i < 5; i++) {
            _tokenId.increment();
            uint tokenId = _tokenId.current();
            if (count > 0) {
                _mint(me, tokenId);
                count -= 1;
            } else {
                _mint(leader_, tokenId);
            }
            member[i] = tokenId;
            leaders[tokenId] = leader_;
        }

        teams[leader_] = Team({
        leader: leader_,
        totalReward: 0,
        rewarded: 0,
        member: member
        });
        teamList.push(leader_);

        return true;
    }

    function addOldReward(address leader_, uint totalReward_, uint rewarded_) public onlyOwner returns (bool) {
        require(leader_ != address(0), "S: Invalid leader.");
        teams[leader_].rewarded += rewarded_;
        teams[leader_].totalReward += totalReward_;
        return true;
    }

    function addReward(address leader_, uint amount_) public returns (bool) {
        require(leader_ != address(0), "S: Invalid leader.");
        require(_msgSender() == meta.core || _msgSender() == owner(), "S: Err Operator.");
        teams[leader_].totalReward += amount_;
        return true;
    }

    function viewTeamList() public view returns (address[] memory) {
        return teamList;
    }

    function claimReward(uint tokenId_) public returns (bool) {
        require(_msgSender() == ownerOf(tokenId_), "S: Not NFT owner.");

        address leader = leaders[tokenId_];
        require(leader != address(0), "S: Invalid token leader.");
        uint amount = teams[leader].totalReward - teams[leader].rewarded;
        uint amountSingle = amount / 5;

        uint tokenId;
        address nftOwner;
        for (uint i = 0; i < 5; i++) {
            tokenId = teams[leader].member[i];
            nftOwner = ownerOf(tokenId);
            meta.usdt.safeTransfer(nftOwner, amountSingle);
        }
        teams[leader].rewarded = teams[leader].totalReward;
        return true;
    }

}