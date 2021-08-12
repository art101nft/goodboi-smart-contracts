module.exports = async function main(callback) {
  try {
    const GoodBoiSociety = artifacts.require("GoodBoiSociety");
    const gbs = await GoodBoiSociety.deployed();
    await gbs.withdraw();
    console.log('Contract balance has been withdrawn to contract creator. Check your balance!')
    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
}
