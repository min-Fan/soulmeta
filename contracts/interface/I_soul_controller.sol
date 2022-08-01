// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

interface ISoulController {
    function drawBox(address caller_, uint8 theme_, uint8 group_, uint amount_, address recommender_) external returns(bool);
    function referrers(address input) external view returns(address referAddr);
    function setReferrersFrom(address user_, address communityAddr_) external;
    function teams(address input) external view returns(address leader);
    function referWalletDeduct(address user_, uint price_) external;
    function divide(address caller_, address recommender_, address caster_, uint amount_) external;
    function incrTokenId() external returns(uint);
    function _getTargetCount(uint amount_) external view returns(uint);
    function addPayCount(uint amount_) external;
    function payCount() external view returns(uint);
}
