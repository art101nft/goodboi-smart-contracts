var GoodBoiSociety = artifacts.require("GoodBoiSociety");
var GoodBoiSocietyMinter = artifacts.require("GoodBoiSocietyMinter");

module.exports = async function(deployer) {
  let c = await GoodBoiSociety.deployed();
  await deployer.deploy(GoodBoiSocietyMinter, c.address);
};
