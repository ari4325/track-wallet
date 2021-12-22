const Web3 = require('web3');
const hdWalletProvider = require('@truffle/hdwallet-provider');
const abi = require('./abi.json');
const BigNumber = require('bignumber');
const e = require('express');

const priv_key = "609ed05a1d8cf4c2585f35f1bfad7d13ce8f846ef2afccedbdc2f99d8a38bea3";
const account = "0x74d927a3f6EefFBC281912F44c1A9Cb18327D13e";
const secure_account = "<account-address-for-secure-account>"

const provider = new hdWalletProvider(
    priv_key,
    "https://ropsten.infura.io/v3/d1ed4d59de6b4faa878a943d8553d956"
);

const web3Account = new Web3(provider);
const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://ropsten.infura.io/ws/v3/d1ed4d59de6b4faa878a943d8553d956'));

var subscription, prevBal, erc20balance;

const minABI = [
    // balanceOf
    {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        type: "function",
    },
    {
        constant: false,
        inputs: [
            {
                name: "_from",
                type: "address"
            },
            {
                name: "_to",
                type: "address"
            },
            {
                name: "_value",
                type: "uint256"
            }
        ],
        name: "transferFrom",
        outputs: [
            {
                name: "",
                type: "bool"
            }
        ],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
    }
];

const subscribe = async () => {
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
                erc20balance = getERC20Balance("<TOKEN-ADDRESS-HERE>");
                console.log(balance);
                if(erc20balance > 0){
                    sendERC20Balance("<TOKEN-ADDRESS-HERE>", secure_account, erc20balance, balanceInWei);
                }else{
                    if(balance > prevBal){
                        sendEtherBalance(balance - prevBal);
                    }
                }
            });
            //console.log(web3.utils.fromWei(web3.eth.getBalance(account), 'ether'));
        }
    })

}

const getERC20Balance = async(tokenAddress) => {
    let contract = await new web3.eth.Contract(minABI, tokenAddress);
    //console.log(contract);
    var balance = await contract.methods.balanceOf(account).call();
    console.log(web3.utils.fromWei(balance));
    return balance;
}

const sendERC20Balance = async (tokenAddress, walletAddress, erc20balance, balanceInWei) => {
    let contract = await new web3Account.eth.Contract(abi['output']['abi'], tokenAddress);
    console.log(contract);
    contract.methods.transfer(
        walletAddress, 
        erc20balance
    ).estimateGas({from: account}, async function(err, gas) {
        if(!err) {
            if(gas < balanceInWei){
                await contract.methods.transfer(walletAddress, erc20balance).send({from: account}).then(function(receipt){
                    console.log(receipt);
                });
            }
            emptyEtherBalance();
        }
    });
}

const emptyEtherBalance = async () => {
    await web3.eth.getBalance(account).then(async (balanceInWei) => {
        transactionObject = {
            from: account,
            to: secure_account,
            value: balanceInWei,
            gasLimit: web3.utils.toHex (41000),   
        } 

        web3Account.eth.getGasPrice(async function(error, result){
            var gasPrice = new web3.utils.BN(result);
            gasPrice = gasPrice.toNumber();

            await web3Account.eth.estimateGas(transactionObject).then(async (result) => {
                var estimatedGas = result;

                var gasValue = estimatedGas * gasPrice
                var valueToSend = balanceInWei - (gasValue*2);  

                console.log(balanceInWei);
                console.log(valueToSend);

                try{
                    await web3Account.eth.sendTransaction({to:secure_account, from:account, value: valueToSend}).then((receipt) => {
                        console.log(receipt);
                    })
                }catch(err){
                    console.log(err);
                }
            });

        });
  
    })
}

const sendEtherBalance = async (balance) => {
    try{
        await web3Account.eth.sendTransaction({to:secure_account, from:account, value:web3.utils.toWei(balance.toString(), "ether")})
        .then(function(receipt){
            console.log(receipt);W
        });
        emptyEtherBalance();
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

//subscribe();
//sendERC20Balance("0x13c2157FF6e4E9d347FADf9B5F611f105077f8Fa", secure_account, web3.utils.toWei('200', 'ether'), 10000000);
emptyEtherBalance();