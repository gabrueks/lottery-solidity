const assert = require("assert");
const ganache = require("ganache-core");
const Web3 = require("web3");
const {
  abi,
  evm: {
    bytecode: { object },
  },
} = require("../compile");

const web3 = new Web3(ganache.provider());

let accounts;
let lottery;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  lottery = await new web3.eth.Contract(abi)
    .deploy({
      data: object,
    })
    .send({ from: accounts[0], gas: "1000000", gasPrice: "20" });
});

describe("Lottery contract", () => {
  it("Should deploy lottery contract and have an address", () => {
    assert.ok(lottery.options.address);
  });

  it("Should create the lottery contract with a manager", async () => {
    const manager = await lottery.methods.manager().call();
    assert(manager, accounts[0]);
  });

  it("Should enter players correctly", async () => {
    await lottery.methods
      .enter()
      .send({ from: accounts[0], value: web3.utils.toWei("0.011", "ether") });
    await lottery.methods
      .enter()
      .send({ from: accounts[1], value: web3.utils.toWei("0.011", "ether") });

    const players = await lottery.methods.getPlayers().call();

    assert(players.length, 2);
    assert(players.includes(accounts[0]), true);
    assert(players.includes(accounts[1]), true);
  });

  it("Should throw an error when trying to enter without enough wei", async () => {
    try {
      await lottery.methods.enter().send({ from: accounts[0], value: 0 });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("Should throw an error when trying to enter more than once", async () => {
    try {
      await lottery.methods
        .enter()
        .send({ from: accounts[0], value: web3.utils.toWei("0.011", "ether") });
      await lottery.methods
        .enter()
        .send({ from: accounts[0], value: web3.utils.toWei("0.011", "ether") });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("Only manager can call pick winner", async () => {
    try {
      await lottery.methods.pickWinner().send({ from: accounts[1] });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("Pick winner should fail if there's no player", async () => {
    try {
      await lottery.methods.pickWinner().send({ from: accounts[0] });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("Pick winner should pick the first player", async () => {
    await lottery.methods
      .enter()
      .send({ from: accounts[0], value: web3.utils.toWei("0.011", "ether") });
    const winner = await lottery.methods
      .pickWinner()
      .send({ from: accounts[0] });
    assert(winner, accounts[0]);
  });

  it("Sends money to the winner and resets the players array", async () => {
    await lottery.methods
      .enter()
      .send({ from: accounts[0], value: web3.utils.toWei("2", "ether") });
    const firstPlayerBalance = await web3.eth.getBalance(accounts[0]);

    const winner = await lottery.methods
      .pickWinner()
      .send({ from: accounts[0] });
    assert(winner, accounts[0]);

    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - firstPlayerBalance;
    assert(difference > web3.utils.toWei("1.8", "ether"));

    const players = await lottery.methods.getPlayers().call();
    assert.equal(players.length, 0);
  });
});
