const CoinFlip = artifacts.require("CoinFlip");

module.exports = async function(deployer) {
  deployer.deploy(CoinFlip, {value: web3.utils.toWei("1", "ether")});  
};