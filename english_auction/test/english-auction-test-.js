const { time } = require("@openzeppelin/test-helpers");

const { assert, expect } = require("chai")
const chai = require("chai")
chai.use(require("chai-as-promised"))

const EnglishAuction = artifacts.require("EnglishAuction")
const NFT = artifacts.require("ERC721")

contract('', (accounts) => {
    const nftID = Math.floor(Math.random() * 1000)
    let nft
    let englishAuction
    let startingBid = 1

    // let bidDuration = 10

    beforeEach(async () => {
        nft = await NFT.new({from: accounts[0]})

        await nft.mint(accounts[1], nftID, {
            from: accounts[1]
        })

    })

    describe('constructor', () => {
        it('should deploy', async () => {
            englishAuction = await EnglishAuction.new(
                nft.address, nftID, startingBid, {
                    from: accounts[1]
                })        
           
            assert.equal(await englishAuction.getNFTAddress(), nft.address,
                "NFT addres doesn't match")

            assert.equal(await englishAuction.nftID(), nftID,
                "nftID doesn't match")

            assert.equal(await englishAuction.highestBid(), startingBid,
                "Starting Bid values don't match")

            assert.equal(await englishAuction.seller(), accounts[1],
                "Starting Bid values don't match")
        })
    });

    describe('approve', () => {
        it('should be approved', async() => {
            englishAuction = await EnglishAuction.new(
                nft.address, nftID, startingBid, {
                    from: accounts[1]
            })        
           
            assert.equal(await nft.balanceOf(accounts[1]), 1, 
                "Balance doesn't match!")
            assert.equal(await nft.ownerOf(nftID), accounts[1], 
                "Owner doesn't match")

            await nft.approve(accounts[1], nftID, {
                from: accounts[1]
            })
            assert.equal(await nft.getApproved(nftID), accounts[1],
                "Not approved")
        })

        it('should not be aproved', async() => {
            englishAuction = await EnglishAuction.new(
                nft.address, nftID, startingBid, {
                    from: accounts[1]
                })
            
            await expect(nft.approve(
                accounts[1], nftID, { from: accounts[0]}
            )).to.be.rejected

        })
    });

    describe('start', () => {
        it('should start', async () => {
            englishAuction = await EnglishAuction.new(
                nft.address, nftID, startingBid, {
                    from: accounts[1]
            })        
           
            await nft.approve(accounts[1], nftID, {
                from: accounts[1]
            })

            await englishAuction.start({ from: accounts[1] })

            assert.equal(await englishAuction.started(), true,
                "Started flag not set")
        })

        it('should not start', async () => {
            englishAuction = await EnglishAuction.new(
                nft.address, nftID, startingBid, {
                    from: accounts[1]
            })        
           
            await nft.approve(accounts[1], nftID, {
                from: accounts[1]
            })
        
            await expect(englishAuction.start({ from: accounts[0] })
                ).to.be.rejected

        })
    });

    describe('Bid', () => {
        it('should run normally', async () => {
            englishAuction = await EnglishAuction.new(
                nft.address, nftID, startingBid, {
                    from: accounts[1]
            })        
           
            await nft.approve(accounts[1], nftID, {
                from: accounts[1]
            })

            await englishAuction.start({ from: accounts[1] })

            const Bid1 = 10
            const Bid2 = 20
            const Bid3 = 30

            await englishAuction.bid({
                from: accounts[2],
                value: Bid1
            })
            
            await englishAuction.bid({
                from: accounts[3],
                value: Bid2
            })

            await englishAuction.bid({
                from: accounts[2],
                value: Bid3
            })
        
            let duration = time.duration.seconds(5)
            await time.increase(duration)

            await englishAuction.end({from: accounts[2]})

            await englishAuction.withdraw({from: accounts[3]})
        })

        it('should not end bid', async () => {
            englishAuction = await EnglishAuction.new(
                nft.address, nftID, startingBid, {
                    from: accounts[1]
            })        
           
            await nft.approve(accounts[1], nftID, {
                from: accounts[1]
            })

            await englishAuction.start({ from: accounts[1] })

            const Bid1 = 10
            const Bid2 = 20
            const Bid3 = 30

            await englishAuction.bid({
                from: accounts[2],
                value: Bid1
            })
            
            await englishAuction.bid({
                from: accounts[3],
                value: Bid2
            })

            await englishAuction.bid({
                from: accounts[2],
                value: Bid3
            })
        
            await expect(englishAuction.end({from: accounts[2]})
                ).to.be.rejected

        })

    });

})
