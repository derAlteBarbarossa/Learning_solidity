// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

// Import ERC-20 from OpenZeppelin
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.0.0/contracts/token/ERC20/ERC20.sol";

contract SwappableToken {
    IERC20 public token1;
    IERC20 public token2;
    address public owner1;
    address public owner2;

    constructor(
        address _owner1,
        address _token1,
        address _owner2,
        address _token2
    )
    {
        token1 = IERC20(_token1);
        token2 = IERC20(_token2);

        owner1 = _owner1;
        owner2 = _owner2;
    }

    function swap(uint amount1, uint amount2) public {
        require(msg.sender == owner1 || msg.sender == owner2,
            "Only token owners are authorised for swap action");

        require(token1.allowance(owner1, address(this)) > amount1,
            "Not allowed for this amount of token1");

        require(token2.allowance(owner2, address(this)) > amount2,
            "Not allowed for this amount of token2");

        bool memory sent;

        sent = token1.transferFrom(owner1, owner2, amount1);
        require(sent, "Sending token from owner1 to owner2 failed");
        
        sent = token2.transferFrom(owner2, owner1, amount2);
        require(sent, "Sending token from owner2 to owner1 failed");
    }

}
