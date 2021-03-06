module.exports = async function main(callback) {
  try {
    const GoodBoiSociety = artifacts.require("GoodBoiSociety");
    const gbs = await GoodBoiSociety.deployed();
    const existingPrime = (await gbs.RAND_PRIME()).toString();
    const existingTimestamp = (await gbs.TIMESTAMP()).toString();
    console.log(`RAND_PRIME: ${existingPrime}`);
    console.log(`TIMESTAMP: ${existingTimestamp}`);
    console.log(`CONTRACT_ADDRESS: ${gbs.address}`);
    console.log(`BASE_URI: ${await gbs.baseURI()}`);
    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
}
