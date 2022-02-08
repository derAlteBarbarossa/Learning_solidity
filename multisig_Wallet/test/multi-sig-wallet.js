const { assert } = require("chai");
const chai = require("chai");
chai.use(require("chai-as-promised"));

const expect = chai.expect

const MultiSigWallet = artifacts.require("MultiSigWallet")

contract("MultiSigWallet", accounts => {
    const owners = [accounts[0], accounts[1], accounts[2]]
    const NUM_CONFIRMATIONS_REQUIRED = 2
    
    let wallet

    beforeEach(async() => {
        wallet = await MultiSigWallet.new(owners, NUM_CONFIRMATIONS_REQUIRED)
    })

    describe('constructor', () => {

        it('should deploy', async () => {
            for (let i = 0; i < owners.length; i++) {
                assert.equal(await wallet.owners(i), owners[i])
            }

            assert.equal(await wallet.numConfirmationRequired(),
                NUM_CONFIRMATIONS_REQUIRED)
        })

        it('should reject if no owner', async () => {
            await expect(MultiSigWallet.new([], NUM_CONFIRMATIONS_REQUIRED))
                .to.be.rejected
        })

        it('should reject numConfirmationsRequired > |owners|', async () => {
            await expect(MultiSigWallet.new(owners, owners.length + 1))
                .to.be.rejected
        })

    });

    describe('fallback', () => {
        it('should receive ether', async () => {
            const { logs } = await wallet.sendTransaction({
                from: accounts[0],
                value: 1,
            })

            assert.equal(logs[0].event, "Deposit")
            assert.equal(logs[0].args.sender, accounts[0])
            assert.equal(logs[0].args.amount, 1)
            assert.equal(logs[0].args.balance, 1)

        })
    });

    describe('submitTransaction', () => {
        const to = accounts[3]
        const value = 10
        const data = "0x0123"

        it('should submit transaction', async () => {
            const { logs } = await wallet.submitTransaction(to, value, data, {
                from: owners[0],
            })

            assert.equal(logs[0].event, "SubmitTransaction")
            assert.equal(logs[0].args.owner, owners[0])
            assert.equal(logs[0].args.txIndex, 0)
            assert.equal(logs[0].args.to, to)
            assert.equal(logs[0].args.value, value)
            assert.equal(logs[0].args.data, data)

            const tx = await wallet.getTransaction(0)
            assert.equal(tx.to, to)
            assert.equal(tx.value, value)
            assert.equal(tx.data, data)
            assert.equal(tx._executed, false)
            assert.equal(tx.numConfirmations, 0)

        })

        it('should reject if not owner', async () => {
            await expect(wallet.submitTransaction(to, value, data, {
                from: accounts[3],
            })).to.be.rejected
        })

    });

    describe('confirmTransaction', () => {
        beforeEach(async () => {
            const to = accounts[3]
            const value = 0
            const data = "0x0123"
            
            await wallet.submitTransaction(to, value, data, {
                from: owners[0],
            })
        })
        

        it('should confirm', async () => {
            const { logs } = await wallet.confirmTransaction(0, {
                from: owners[0],
            })

            assert.equal(logs[0].event, "ConfirmTransaction")
            assert.equal(logs[0].args.owner, owners[0])
            assert.equal(logs[0].args.txIndex, 0)

            const tx = await wallet.getTransaction(0)
            assert.equal(tx.numConfirmations, 1)
        })
        
        it('should reject if not owner', async () => {
            await expect (
                wallet.confirmTransaction(0, {
                    from: accounts[3],
                })
            ).to.be.rejected
        })

        it('should reject if tx doesn\'t exist', async () => {
            await expect (
                wallet.confirmTransaction(1, {
                    from: owners[0],
                })
            ).to.be.rejected
        })

        it('should reject if already confirmed', async () => {
            await wallet.confirmTransaction(0, {
                    from: owners[0],
                })

            await expect(
                wallet.confirmTransaction(0, {
                    from: owners[0],
                })
            ).to.be.rejected

        })
    
    });

    describe('executeTransaction', () => {
        const to = accounts[3]
        const value = 0
        const data = "0x3210"

        beforeEach(async() => {
            await wallet.submitTransaction(to, value, data, {
                from: owners[0],
            })
            await wallet.confirmTransaction(0, {from: owners[0]})
            await wallet.confirmTransaction(0, {from: owners[1]})
        })

        it('should execute', async () => {
            const { logs } = await wallet.executeTransaction(0)

            assert.equal(logs[0].event, "ExecuteTransaction")
            assert.equal(logs[0].args.owner, owners[0])
            assert.equal(logs[0].args.txIndex, 0)

            const tx = await wallet.getTransaction(0)
            assert.equal(tx._executed, true)
        })

        it('should reject if already executed', async () => {
            await wallet.executeTransaction(0, {
                from: owners[0]
            })

            await expect(
                wallet.executeTransaction(0, {
                    from: owners[0]
                })
            ).to.be.rejected
        })

        it('should reject if not owner', async () => {
            await expect(
                wallet.executeTransaction(0, {
                    from: accounts[3]
                })
            ).to.be.rejected
        })

        it('should reject if tx doesn\'t exist', async () => {
            await expect(
                wallet.executeTransaction(1, {
                    from: owners[0]
                })
            ).to.be.rejected 
        })

    });

    describe('revokeConfirmation', () => {
        beforeEach( async() => {
            const to = accounts[3]
            const value = 0
            const data = "0x11"

            await wallet.submitTransaction(to, value, data, {
                from: owners[0]
            })
        })

        it('should revoke', async () => {
            await wallet.confirmTransaction(0, {
                from: owners[0]
            })

            const { logs } = await wallet.revokeConfirmation(0, {
                from: owners[0]
            })

            assert.equal(logs[0].event, "RevokeConfirmation")
            assert.equal(logs[0].args.owner, owners[0])
            assert.equal(logs[0].args.txIndex, 0)

            const tx = await wallet.getTransaction(0)

            assert.equal(tx.numConfirmations, 0)

        })

        it('should reject if not owner', async () => {
            await expect(
                wallet.confirmTransaction(0, {
                    from: accounts[4]
                })
            ).to.be.rejected
        })

        it('should reject if not confirmed yet', async () => {
            await expect(
                wallet.revokeConfirmation(0, {
                    from: owners[0]
                })
            ).to.be.rejected
            
        })
    });

})