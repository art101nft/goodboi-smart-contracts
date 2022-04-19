
module.exports = async function main(callback) {
  const GoodBoiSociety = artifacts.require("GoodBoiSociety");
  const GoodBoiSocietyMinter = artifacts.require("GoodBoiSocietyMinter");

  let gbs = await GoodBoiSociety.deployed();
  let gbsm = await GoodBoiSocietyMinter.deployed();

  gbs.setRandPrime('911');
  gbs.mintDoge(1, {value: web3.utils.toWei('.075', 'ether')});
  gbs.transferOwnership(gbsm.address);

  gbsm.setMintable(true);
  web3.eth.sendTransaction({from: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1', to: gbsm.address, value: web3.utils.toWei('.225', 'ether'), chain: '1337'})
  gbsm.mint(3);
  web3.eth.getBalance(gbs.address);
  web3.eth.getBalance(gbsm.address);

  // for (i=0; i<3325; i++){ gbsm.mint(3) };
  callback(0);
}
