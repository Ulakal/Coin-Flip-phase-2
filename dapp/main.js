var web3 = new Web3(Web3.givenProvider);
var contractInstance;
$(document).ready(function() {
    window.ethereum.enable().then(function(accounts){
        contractInstance = new web3.eth.Contract(abi, "0xD1987fE48A1941b4c47C202e02E6F6B22aF73be5", {from: accounts[0]});
        console.log(contractInstance);
    });

    $("#flip").click(flipAcoin);
    $("#withdraw").click(withdraw);
    $("#showbalance").click(balance);
    $("#withdrawbalance").click(withdrawbalance);
    
});

async function flipAcoin(){

    let blockNumber;
    let hash;
    let queryId;
    let coinside = $("input[name=coinside]:checked").val();
    let betvalue = $("#bet_input").val();
    let config = {
        value: Web3.utils.toWei(betvalue, "ether")
    }
    console.log("the coinside is " + coinside);
    console.log("the bet amount is " + betvalue);

    if (betvalue < 0.1) {
      alert("minimum bet is 0.1 ether");
      return;
    }

    //Registering the block number.
    blockNumber = await web3.eth.getBlockNumber();

    //Flip ()
    contractInstance.methods.flip(coinside).send(config)

    .on("transactionHash", async function(_hash){

        //The transaction hash can be used to retrieve the events, and to get the query Id.
        hash = _hash;
        console.log('Tx Hash:' + ' ' + hash);
        $("#action").text("Wait for your transaction to be confirmed");
    })
    .on("confirmation", async function(confirmationNr)
    {
        if(confirmationNr==0){
        $("#action").text("Transaction confirmed! Wait for result of your game");
    }
      

      web3.eth.getTransactionReceipt(hash).then(async function(res) {
        console.log('The query ID is:' + ' ' + res.logs[2].data);
        queryId = { 'queryId' : res.logs[2].data };
    })

    contractInstance.once('coinFlipResult',
    {
      filter: queryId,
      fromBlock: blockNumber,
      toBlock: 'latest'
    }, function (error,event){
      if(event != undefined){
        console.log('Query id' + ' ' + queryId.queryId + ' ' + event.returnValues.win);
        if (event.returnValues.win == true){
            var prize = web3.utils.fromWei(event.returnValues.prize, "ether");
            $("#action").text("Congratulations! You won! Your prize is: " + prize + " ether");
        } else {
            $("#action").text("You lost a bet");
        }
      }
    })
  })
}


function balance(){
    contractInstance.methods.showBalance().call().then(function(res){
        let balance = web3.utils.fromWei(res, "ether");
        $("#balance").text(balance);
    })
}

function withdraw(){
    contractInstance.methods.withdrawPrize().send().on("error", function(error){
            alert("You didnt win any prize");
            return;
        }).on("transactionHash", function(){
            $("#action").text(" ");
        })
}

function withdrawbalance(){
    contractInstance.methods.kill().send();
}



/*function flipAcoin(){
    var coinside = $("input[name=coinside]:checked").val();
    var betvalue = $("#bet_input").val();
    var config = {
        value: Web3.utils.toWei(betvalue, "ether")
    }
    var query_Id;
    console.log("the coinside is " + coinside);
    console.log("the bet amount is " + betvalue);
    
    if (betvalue<0.1) {
        alert("minimum bet is 0.1 ether");
        return;
    }

    contractInstance.methods.flip(coinside).send(config)
    .on("transactionHash", function(hash){
        console.log(hash);
        $("#action").text("Wait for your transaction to be confirmed");
    })
    .on("confirmation", function(confirmationNr){
        if (confirmationNr == 0) {
            console.log("transaction confirmed");
            $("#action").text("Transaction confirmed! Wait for result of your game");
        };  
    })

    
    contractInstance.events.LogQueryId(function(error, result){
        query_Id = result.returnValues.queryId;
        console.log(query_Id);
    })

    contractInstance.once('coinFlipResult'
        , {filter: {queryId: query_Id}
        , fromBlock: 0
        , toBlock: 'latest'
     }, function(error, event){
        console.log(event);
        if (event.returnValues.win == true) {
            let prize = web3.utils.fromWei(event.returnValues.prize, "ether")
            $("#action").text("Congratulations! You won! Your prize is: " + prize);
        }
        else {
            $("#action").text("Ahhh... You lost a bet");
        }
    })  
}*/
    


   


