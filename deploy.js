require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const {
  abi,
  evm: {
    bytecode: { object },
  },
} = require("./compile");

const { INFURA_ROPSTEN_ENDPOINT, MNEMONIC_PHRASE_WALLET } = process.env;

const mnemonicPhrase = MNEMONIC_PHRASE_WALLET;

const providerUrl = INFURA_ROPSTEN_ENDPOINT;

const provider = new HDWalletProvider({
  mnemonic: {
    phrase: mnemonicPhrase,
  },
  providerOrUrl: providerUrl,
});

const web3 = new Web3(provider);

const deploy = async () => {
  try {
    const accounts = await web3.eth.getAccounts();

    const result = await new web3.eth.Contract(abi)
      .deploy({
        data: object,
      })
      .send({ from: accounts[0], gasPrice: "5200000000" });

    console.log(abi);
    console.log("Contract deployed to: ", result.options.address);

    provider.engine.stop();
  } catch (err) {
    console.log(err);
  }
};

deploy();
