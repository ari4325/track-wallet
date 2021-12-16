const Web3 = require('web3');
const hdWalletProvider = require('@truffle/hdwallet-provider');

const priv_key = "<REPLACE THIS>";
const account = "<REPLACE THIS>";

const provider = new hdWalletProvider(
    priv_key,
    "<INFURA HTTP-URL-HERE>"
);

const web3Account = new Web3(provider);
const web3 = new Web3(new Web3.providers.WebsocketProvider('<INFURA WEB-SOCKET-URL HERE>'));

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
        await web3Account.eth.sendTransaction({to:"<ENTER RECIPIENT-ADDRESS-HERE>", from:account, value:web3.utils.toWei(balance.toString(), "ether")})
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