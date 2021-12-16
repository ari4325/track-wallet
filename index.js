const Web3 = require('web3');
const hdWalletProvider = require('@truffle/hdwallet-provider');

const priv_key = "609ed05a1d8cf4c2585f35f1bfad7d13ce8f846ef2afccedbdc2f99d8a38bea3";
const account = "0x74d927a3f6EefFBC281912F44c1A9Cb18327D13e";

const provider = new hdWalletProvider(
    priv_key,
    "https://ropsten.infura.io/v3/d1ed4d59de6b4faa878a943d8553d956"
);

const web3Account = new Web3(provider);
const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://ropsten.infura.io/ws/v3/d1ed4d59de6b4faa878a943d8553d956'));

var subscription, prevBal;

const subsribe = async () => {
    await web3.eth.getBalance(account).then((balanceInWei) => {
        prevBal = web3.utils.fromWei(balanceInWei);
    })
    
    subscription = web3.eth.subscribe('newBlockHeaders', (err, result) => {
        if(err){
            console.log(err);
        }else{
            console.log(result);
            web3.eth.getBalance(account).then(async (balanceInWei) => {
                var balance = web3.utils.fromWei(balanceInWei)
                console.log(balance);
                if(balance > prevBal){
                    sendEtherBalance(balance - prevBal);
                }
            });
            //console.log(web3.utils.fromWei(web3.eth.getBalance(account), 'ether'));
        }
    })

}

const sendEtherBalance = async (balance) => {
    try{
        await web3Account.eth.sendTransaction({to:"0x467b26C713fD3072A1f1abb94277dE3140574d49", from:account, value:web3.utils.toWei(balance.toString(), "ether")})
        .then(function(receipt){
            console.log(receipt);
        });
    } catch(err){
        console.log(err);
    }   
}

const unSubscribe = () => {
    subscription.unsubscribe(function(error, success){
        if (success) {
            console.log('Successfully unsubscribed!');
        }
    });
}

subsribe();