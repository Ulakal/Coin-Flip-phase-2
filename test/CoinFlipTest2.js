const CoinFlip = artifacts.require("CoinFlip");
const AssertionError = require("assertion-error");
const truffleAssert = require("truffle-assertions");

contract("CoinFlip", async function(accounts){
    it("checks if contract balance is set correctly", async function(){
        let instance = await CoinFlip.deployed();
        let realbalance = await web3.eth.getBalance(instance.address);
        let deployedbalance = await web3.utils.toWei("1", "ether");
        deployedbalance = parseFloat(deployedbalance);
        assert(realbalance == deployedbalance);
    });
    it ("increases balance with correct amount after bet is set", async function(){
        let instance = await CoinFlip.deployed();
        let balanceBefore = await instance.showBalance();
        balanceBefore = parseFloat(balanceBefore);
        await instance.flip(1, {value: web3.utils.toWei("0.1", "ether")});
        let balanceAfter = await instance.showBalance();
        balanceAfter = parseFloat(balanceAfter);
        let myvalue = balanceBefore + parseFloat(web3.utils.toWei("0.1", "ether"));
        assert(myvalue == balanceAfter);
        });
    it ("shouldn't set a bet with too low payment", async function(){
        let instance = await CoinFlip.deployed();
        await truffleAssert.fails(instance.flip(1, {value: 1000}), truffleAssert.ErrorType.REVERT);
    });
    it ("shouldn't set a bet with too high payment", async function(){
        let instance = await CoinFlip.deployed();
        let balance = await instance.showBalance();
        let floatbalance = parseFloat(balance);
        let myvalue = floatbalance + 100; 
        await truffleAssert.fails(instance.flip(1, {value: myvalue}), truffleAssert.ErrorType.REVERT);
    });
    it ("shouldn't set a bet with wrong coinside parameter", async function(){
        let instance = await CoinFlip.deployed();
        await truffleAssert.fails(instance.flip(2, {value: web3.utils.toWei("0.1", "ether")}), truffleAssert.ErrorType.REVERT);
    });
    it ("should set a bet with all correct parameters", async function(){
        let instance = await CoinFlip.deployed();
        await truffleAssert.passes(instance.flip(1, {from: accounts[0], value: web3.utils.toWei("0.1", "ether")}));
    });
    it("contract balance is the same as contract blockchain address balance", async function(){
        let instance = await CoinFlip.deployed();
        let balance = await instance.showBalance();
        let floatbalance = parseFloat(balance);
        let blockchainbalance = await web3.eth.getBalance(instance.address);
        assert(floatbalance == blockchainbalance);
    });
    it("shouldn't allow non owner to kill the contract", async function(){
        let instance = await CoinFlip.deployed();
        await truffleAssert.fails(instance.kill({from: accounts[1]}), truffleAssert.ErrorType.REVERT);
    });
    it ("should allow owner to kill the contract", async function(){
        let instance = await CoinFlip.deployed();
        await truffleAssert.passes(instance.kill({from: accounts[0]}));
    })
    it ("increases owners balance after killing the contract", async function(){
        let instance = await CoinFlip.new({value: web3.utils.toWei("1", "ether")});
        let balanceBefore = await web3.eth.getBalance(accounts[0]);
        await instance.kill({from: accounts[0]});
        let balanceAfter = await web3.eth.getBalance(accounts[0]);
        assert(balanceBefore < balanceAfter);
    })
    
    })
    
    

