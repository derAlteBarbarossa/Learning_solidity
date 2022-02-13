// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./NFT.sol";

/*
interface IERC721 {
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
        ) external;
}
*/

contract EnglishAuction {
    IERC721 public immutable nft;
    uint public immutable nftID;

    address payable public immutable seller;
    uint public endAt;
    bool public started;
    bool public ended;

    address public highestBidder;
    uint public highestBid;
    
    mapping(address => uint) public bids;

    // Events
    event Start(uint startingTime);
    event Bid(address highestBidder, uint highestBid);
    event Withdraw(address Bidder, uint Bid);
    event End();
    
    constructor(
        address _nft,
        uint _nftID,
        uint _startingBid
    )
    {
        nft = IERC721(_nft);
        nftID = _nftID;
        seller = payable(msg.sender);
        highestBid = _startingBid;
    }

    function start() external {
        require(msg.sender == seller, "Only seller can start the Auction!");
        require(!started, "Auction is already started");

        started = true;
        endAt = block.timestamp + 5;

        nft.transferFrom(seller, address(this), nftID);

        emit Start(block.timestamp);
    }

    function bid() external payable {
        require(started, "The Auction has not started yet!");
        require(block.timestamp < endAt, "The Auction has ended!");
        require(msg.value > highestBid, "Bid is not high enough");

        if (highestBidder != address(0)) {
            bids[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;

        emit Bid(highestBidder, highestBid);
    }

    function withdraw() external {
        require(msg.sender != highestBidder,
            "Highest bidder cannot withdraw!");

        uint balance = bids[msg.sender];
        bids[msg.sender] = 0;

        payable(msg.sender).transfer(balance);

        emit Withdraw(msg.sender, balance);
    }

    function end() external {
        require(started, "Auction not started yet!");
        require(ended, "Auction not ended yet!");
        require(block.timestamp > endAt,
            "Can't end before the set time");

        ended = true;

        if (highestBidder == address(0)) {
            nft.transferFrom(address(this), seller, nftID);
        } else {
            nft.transferFrom(address(this), highestBidder, nftID);
            seller.transfer(highestBid);
        }
        

        emit End();

    }

    //  These functions are for testing only
    function getNFTAddress()
        public
        view
        returns(address)
    {
        return address(nft);
    }

}
