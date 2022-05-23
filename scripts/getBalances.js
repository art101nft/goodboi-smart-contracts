
module.exports = async function main(callback) {
  const GoodBoiSociety = artifacts.require("GoodBoiSociety");
  const GoodBoiSocietyMinter = artifacts.require("GoodBoiSocietyMinter");

  let gbs = await GoodBoiSociety.deployed();
  let gbsm = await GoodBoiSocietyMinter.deployed();

  let b1 = await gbs.balanceOf(gbsm.address);
  let b2 = await gbs.balanceOf('0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1');
  // gbsm.mint(3)
  console.log(b1);
  console.log(b2);
  callback(0);
}
