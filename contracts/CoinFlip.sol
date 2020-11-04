import "./Ownable.sol";
import "./provableAPI.sol";
import "./SafeMath.sol";

pragma solidity 0.5.12;


contract CoinFlip is Ownable, usingProvable {

    uint256 constant NUM_RANDOM_BYTES_REQUESTED = 1;
    uint256 public balance;
    
    struct Bet {
        address payable player;
        uint256 coinside;
        uint256 betvalue;
    }

    struct Result {
        bool win;
        uint prize;
    }
    
    mapping (bytes32 => Bet) private bettings;
    mapping (bytes32 => Result) private results;
    mapping (address => bytes32) private IDs;
    mapping (address => bool) private waiting;
    mapping (address => uint) private playersBalances;

    event proofRandomFailed(bytes32 queryId);
    event LogNewProvableQuery(string description);
    event LogQueryId(bytes32 queryId);
    event generatedRandomNumber(uint256 randomNumber);
    event coinFlipResult (bytes32 indexed queryId, address player, bool win, uint prize);

    constructor() public payable {
        balance = msg.value;
        provable_setProof(proofType_Ledger);
    }

    function flip (uint myCoinSide) public payable {
        require (msg.value >= 0.1 ether, "minimum bet is 0.1 ether");
        require (msg.value <= address(this).balance, "bet must be less than a jackpot");
        require (waiting[msg.sender] == false);

        balance = SafeMath.add(balance, msg.value);
        waiting[msg.sender] = true;

        uint256 QUERY_EXECUTION_DELAY = 0;
        uint256 GAS_FOR_CALLBACK = 200000;
        uint coinside = myCoinSide;
        //bytes32 queryId = random();
        
        bytes32 queryId = provable_newRandomDSQuery(QUERY_EXECUTION_DELAY, NUM_RANDOM_BYTES_REQUESTED, GAS_FOR_CALLBACK);
        
        emit LogNewProvableQuery("Provable query was sent, standing by for the answer...");
        emit LogQueryId (queryId);

        setAbet(queryId, msg.sender, msg.value, coinside);
        IDs[msg.sender] = queryId;
        //balance = address(this).balance;
    }

    
    function setAbet(bytes32 _queryId, address payable player, uint myBetValue, uint myCoinSide) private {
        require (myCoinSide == 0 || myCoinSide == 1);
        
        bytes32 queryId = _queryId;    
        Bet memory newbet;
        
        newbet.player = player;
        newbet.coinside = myCoinSide;
        newbet.betvalue = SafeMath.sub(myBetValue, provable_getPrice("random"));
        bettings[queryId] = newbet;

        assert(keccak256
        (abi.encodePacked 
        (bettings[queryId].coinside, bettings[queryId].betvalue)) 
        == 
        keccak256
        (abi.encodePacked
        (newbet.coinside, newbet.betvalue)));

    }


    function __callback(bytes32 _queryId, string memory _result, bytes memory _proof) public {
        require(msg.sender == provable_cbAddress());
        
        if (provable_randomDS_proofVerify__returnCode(_queryId, _result, _proof) != 0) {
            emit proofRandomFailed(_queryId);
        } 
        else {
            uint256 randomNumber = uint256(keccak256(abi.encodePacked(_result))) % 2;
        
             if (randomNumber == bettings[_queryId].coinside) {
                Result memory newresult;
                newresult.win = true;
                newresult.prize = SafeMath.mul(2, bettings[_queryId].betvalue);
                results[_queryId] = newresult;
                playersBalances[bettings[_queryId].player] = SafeMath.add(playersBalances[bettings[_queryId].player], newresult.prize);
                }

            else { 
                Result memory newresult;
                newresult.win = false;
                newresult.prize = 0;
                results[_queryId] = newresult;
                }
                waiting[bettings[_queryId].player] = false;
                emit coinFlipResult (_queryId, bettings[_queryId].player, results[_queryId].win, results[_queryId].prize);
        }
    }


    /*function random() public returns (bytes32) {
        bytes32 queryId = bytes32(keccak256(abi.encodePacked(msg.sender)));
        __callback (queryId, "1", bytes("test"));
        return queryId;
    }*/


    function withdrawPrize() public returns (uint) {
        require(results[IDs[msg.sender]].prize > 0);
        uint toTransfer = playersBalances[msg.sender];

        playersBalances[msg.sender] = 0;
        delete results[IDs[msg.sender]];
        balance = SafeMath.sub(balance, toTransfer);
        msg.sender.transfer(toTransfer);
        assert(results[IDs[msg.sender]].prize == 0);
        return toTransfer;
    }
    
    function showBalance() public view returns (uint) {
        return address(this).balance;
    }

    function fundContract() public onlyOwner payable {
        balance = SafeMath.add(balance, msg.value);
    }

    function kill() public onlyOwner {
        selfdestruct(msg.sender);
    }

}