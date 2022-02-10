const { assert } = require("chai")
const chai = require("chai")
chai.use(require("chai-as-promised"))

var expect = chai.expect
var MyToken = artifacts.require("MyToken.sol")
var TokenSwap = artifacts.require("TokenSwap.sol")

contract("TestTokenSwap", (accounts) => {
    let token1
    let token2
    let amount1
    let amount2

    let tokenSwap

    beforeEach(async() => {

        token1 = await MyToken.new("Alice", "AliceCoin", {
            from: accounts[0]
        })
        // console.log(token1.address)

        token2 = await MyToken.new("Bob", "BobCoin", {
            from: accounts[1]
        })
        // console.log(token2.address)

        amount1 = 10 
        amount2 = 20 

        tokenSwap = await TokenSwap.new(
            accounts[0], token1.address, amount1,
            accounts[1], token2.address, amount2, {
                from: accounts[2]
            })
        
    });


    describe('constructors', () => {
        it('should deploy', async () => {
            assert.equal(await token1.totalSupply(), 100)
            assert.equal(await token2.totalSupply(), 100)

            assert.equal(await tokenSwap.owner1(), accounts[0])
            assert.equal(await tokenSwap.owner2(), accounts[1])
            assert.equal(await tokenSwap.token1(), token1.address)
            assert.equal(await tokenSwap.token2(), token2.address)

            let amounts = await tokenSwap.getAmounts()

            assert.equal(await amounts._amount1, amount1)
            assert.equal(await amounts._amount2, amount2)

        })
    });

    describe('swap', () => {
        it('should swap from owner1', async () => {

            await token1.approve(tokenSwap.address, amount1, {
                from: accounts[0]
            })
            assert.equal(await token1.allowance(accounts[0], tokenSwap.address), amount1)

            await token2.approve(tokenSwap.address, amount2, {
                from: accounts[1]
            })

            assert.equal(await token2.allowance(accounts[1], tokenSwap.address), amount2)
            
            await tokenSwap.swap({from: accounts[0]})
            
            assert.equal(await token1.balanceOf(accounts[1]), amount1)
            assert.equal(await token2.balanceOf(accounts[0]), amount2)

        })

        it('should swap from owner2', async () => {

            await token1.approve(tokenSwap.address, amount1, {
                from: accounts[0]
            })
            assert.equal(await token1.allowance(accounts[0], tokenSwap.address), amount1)

            await token2.approve(tokenSwap.address, amount2, {
                from: accounts[1]
            })

            assert.equal(await token2.allowance(accounts[1], tokenSwap.address), amount2)
            
            await tokenSwap.swap({from: accounts[1]})
            
            assert.equal(await token1.balanceOf(accounts[1]), amount1)
            assert.equal(await token2.balanceOf(accounts[0]), amount2)

        })
        it('should reject from non-owner', async () => {

            await token1.approve(tokenSwap.address, amount1, {
                from: accounts[0]
            })
            assert.equal(await token1.allowance(accounts[0], tokenSwap.address), amount1)

            await token2.approve(tokenSwap.address, amount2, {
                from: accounts[1]
            })

            assert.equal(await token2.allowance(accounts[1], tokenSwap.address), amount2)
            
            await expect(tokenSwap.swap({from: accounts[2]})).to.be.rejected
           
            const balanceOfOwner2InToken1 = await token1.balanceOf(accounts[1])
            const balanceOfOwner1InToken2 = await token2.balanceOf(accounts[0])
            const balanceOfOwner1InToken1 = await token1.balanceOf(accounts[0])
            const balanceOfOwner2InToken2 = await token2.balanceOf(accounts[1])

            assert.equal(balanceOfOwner2InToken1.toString(), '0')
            assert.equal(balanceOfOwner1InToken2.toString(), '0')


            assert.equal(balanceOfOwner1InToken1.toString(), '100')
            assert.equal(balanceOfOwner2InToken2.toString(), '100')
        })
    })

})