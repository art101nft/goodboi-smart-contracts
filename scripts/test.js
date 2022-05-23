
module.exports = async function main(callback) {
  const GoodBoiSociety = artifacts.require("GoodBoiSociety");
  const GoodBoiSocietyMinter = artifacts.require("GoodBoiSocietyMinter");

  let gbs = await GoodBoiSociety.deployed();
  let gbsm = await GoodBoiSocietyMinter.deployed();

  let s = gbs.totalSupply();
  if (s == 0) {

    await gbs.setRandPrime('911');
    await gbs.mintDoge(1, {value: web3.utils.toWei('.075', 'ether')});
    await gbs.transferOwnership(gbsm.address);

    await gbsm.setMintable(true);
    await web3.eth.sendTransaction({from: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1', to: gbsm.address, value: web3.utils.toWei('.225', 'ether'), chain: '1337'})
    await gbsm.mint(3);
  }

  console.log(await web3.eth.getBalance(gbs.address));
  console.log(await web3.eth.getBalance(gbsm.address));
  console.log(await gbs.totalSupply());

  // for (i=0; i<3325; i++){ gbsm.mint(3) };
  callback(0);
}
