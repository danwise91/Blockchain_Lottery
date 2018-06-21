const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const {interface, bytecode} = require('./compile');

const provider = new HDWalletProvider(
	//account mnmenoic
	'identify click toward exhaust outer sketch dune bicycle april pluck album believe',
	//infura API call
	'https://rinkeby.infura.io/<Infura_API_Key>'
);

const web3 = new Web3(provider);

const deploy = async () => {
	const accounts = await web3.eth.getAccounts();

	console.log('Attempting to deploy from account', accounts[0]);

	const result = await new web3.eth.Contract(JSON.parse(interface))
	//deployed contract addresses must have 0x in front of the bytecode
	.deploy({ data: '0x' + bytecode })
	.send({ gas: '1000000', from: accounts[0] });

	console.log('Contract deployed to ', result.options.address);
};

deploy();