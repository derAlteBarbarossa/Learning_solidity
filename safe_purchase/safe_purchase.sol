// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

contract Purchase {
    uint public value;
    address payable public seller;
    address payable public buyer;

    enum State { Created, Locked, Released, Inactive}

    State public state;

    modifier condition(bool condition_) {
        require(condition_);
        _;
    }

    error OnlyBuyer();
    error OnlySeller();
    error InvalidState();
    error ValueNotEven();

    modifier onlyBuyer() {
        if (msg.sender != buyer)
            revert OnlyBuyer();

        _;
    }

    modifier onlySeller() {
        if (msg.sender != seller)
            revert OnlySeller();

        _;
    }

    modifier inState(State _state) {
        if (_state != state)
            revert InvalidState();

        _;
    }

    event Aborted();
    event PurchaseConfirmed();
    event ItemReceived();
    event SellerRefunded();

    constructor() payable {
        seller = payable(msg.sender);
        value = msg.value/2;

        if ((2*value) != msg.value)
            revert ValueNotEven();
    }

    function abort() 
        external
        onlySeller
        inState(State.Created)
    {
        emit Aborted();
        state = State.Inactive;

        seller.transfer(address(this).balance);
    }

    function confirmPurchase()
        external
        inState(State.Created)
        condition(msg.value == (2*value))
        payable
    {
        emit PurchaseConfirmed();
        buyer = payable(msg.sender);
        state = State.Locked;
    }

    function confirmReceived()
        external
        inState(State.Locked)
        onlyBuyer
    {
        emit PurchaseConfirmed();
        state = State.Released;
        buyer.transfer(value);
    }

    function refundSeller()
        external
        onlySeller
        inState(State.Released)
    {
        emit SellerRefunded();
        state = State.Inactive;
        seller.transfer(3*value);
    }
}