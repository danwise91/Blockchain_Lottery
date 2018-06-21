const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const {interface, bytecode} = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
	accounts = await web3.eth.getAccounts();

	lottery = await new web3.eth.Contract(JSON.parse(interface))
		.deploy({data: bytecode})
		.send({ from: accounts[0], gas: '1000000' });
});

//checks for one account to enter
describe('Lottery Contract', () => {
	it('can deploys a contract', () => {
		assert.ok(lottery.options.address);
	});
	//checks for correct amount of wei=> ether is being sent
	it('allows our account to enter', async() => {
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('0.02', 'ether')
		});
	//checks to see if correct player is sending the ether
		const players = await lottery.methods.getPlayers().call({
			from: accounts[0]
		});

		assert.equal(accounts[0], players[0]);
		assert.equal(1, players.length);
	});
	//asserts we can enter on multiple accounts and each addresss is stored in players array
	it('allows multiple accounts to enter', async() => {
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('0.02', 'ether')
		});

		await lottery.methods.enter().send({
			from: accounts[1],
			value: web3.utils.toWei('0.02', 'ether')
		});

		await lottery.methods.enter().send({
			from: accounts[2],
			value: web3.utils.toWei('0.02', 'ether')
		});

		const players = await lottery.methods.getPlayers().call({
			from: accounts[0]
		});

		assert.equal(accounts[0], players[0]);
		assert.equal(accounts[1], players[1]);
		assert.equal(accounts[2], players[2]);

		assert.equal(3, players.length);
	});

	it('requires a minimum amount of ether to enter', async () => {
		try{
		await lottery.methods.enter().send({
			from: accounts[0],
			//200 wei not converted to ether
			value: 200
		});
		//if try does not throw an error it will miss the catch so we need it to assert false and fail the test
		assert(false);
	  } catch(err){
	  	//assert checks for truthyness
	  	assert(err);
	  }
	});

	it('only manager can call pick winner', async() => {
		try{
			await lottery.methods.pickWinner().send({
				//not from the manager
				from: accounts[1]
		  }); 
			assert(false);
		}catch (err){
			//assert error exists
			assert(err);
		}
	});

	it('sends money to the winner and resets the players array', async() => {
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('2', 'ether')
		});

		const initialBalance = await web3.eth.getBalance(accounts[0]);

		//any code after this line will test what occurs AFTER pickWinner is clicked
		await lottery.methods.pickWinner().send({from: accounts[0]});

		const finalBanace = await web3.eth.getBalance(accounts[0]);

		const difference = finalBanace - initialBalance;
		// console.log(difference);
		//1.8 acknowledges some amount of gas cost so its close to the value of 2 but a bit less than 2
		assert(difference > web3.utils.toWei('1.8', 'ether'));

		const lotteryBalance = await web3.eth.getBalance(lottery.options.address);
		assert(lotteryBalance == 0);
		
		const emptyPlayers = await lottery.methods.getPlayers().call({
			from: accounts[0]
		});
		assert.equal(0, emptyPlayers);
		// console.log(emptyPlayers);
	});
});

