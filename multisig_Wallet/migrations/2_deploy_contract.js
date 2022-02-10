const MultiSigWallet = artifacts.require("Migrations");

module.exports = function (deployer, network, accounts) {
    const owners = accounts.slice(0, 3)
    const numConfirmations = 2

    deployer.deploy(MultiSigWallet, owners, numConfirmations);
};
