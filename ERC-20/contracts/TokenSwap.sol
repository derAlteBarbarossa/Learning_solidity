// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

// Import ERC-20 from OpenZeppelin
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenSwap {
    IERC20 public token1;
    IERC20 public token2;
    address public owner1;
    address public owner2;
    uint amount1;
    uint amount2;

    constructor(
        address _owner1,
        address _token1,
        uint _amount1,
        address _owner2,
        address _token2,
        uint _amount2
    )
    {
        token1 = IERC20(_token1);
        token2 = IERC20(_token2);

        owner1 = _owner1;
        owner2 = _owner2;

        amount1 = _amount1;
        amount2 = _amount2;
    }

    function swap() public {
        require(msg.sender == owner1 || msg.sender == owner2,
            "Only token owners are authorised for swap action");

        require(token1.allowance(owner1, address(this)) >= amount1,
            "Not allowed for this amount of token1");

        require(token2.allowance(owner2, address(this)) >= amount2,
            "Not allowed for this amount of token2");

        bool sent;

        sent = token1.transferFrom(owner1, owner2, amount1);
        require(sent, "Sending token from owner1 to owner2 failed");
        
        sent = token2.transferFrom(owner2, owner1, amount2);
        require(sent, "Sending token from owner2 to owner1 failed");
    }

    function getAmounts()
        public
        view
        returns (uint _amount1, uint _amount2)
    {
        return (amount1, amount2);
    }

}
