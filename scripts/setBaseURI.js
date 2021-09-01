const newURI = '';

module.exports = async function main(callback) {
  try {
    const GoodBoiSociety = artifacts.require("GoodBoiSociety");
    const gbs = await GoodBoiSociety.deployed();
    await gbs.setBaseURI(newURI);
    console.log(`Set new contract base metadata URI as: ${newURI}`);
    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
}
