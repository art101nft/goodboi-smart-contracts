module.exports = async function main(callback) {
  try {
    const GoodBoiSociety = artifacts.require("GoodBoiSociety");
    const gbs = await GoodBoiSociety.deployed();
    const supply = Number(await gbs.totalSupply())
    let owners = [];
    console.log(`${new Date()}\n\nFetching details on current Good Boi owners with ${supply} doges minted so far...`);
    for (i = 1; i <= supply; i++) {
      tokenId = await gbs.getTokenId(i);
      owner = await gbs.ownerOf(tokenId);
      console.log(`Mint Index: ${i} - Token ID: ${tokenId} - Owner: ${owner}`);
      if (! owners.includes(owner)) {
        owners.push(owner)
      }
    }
    console.log(`Found ${owners.length} owners!`)
    for (i = 0; i < owners.length; i++) {
      console.log(`- ${owners[i]}`)
    }
    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
}
