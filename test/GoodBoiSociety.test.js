// test/GoodBoiSociety.test.js
const { expect } = require('chai');
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const GoodBoiSociety = artifacts.require('GoodBoiSociety');

// Start test block
contract('GoodBoiSociety', function ([owner, other]) {

  const unsetPrime = new BN('5867');
  const exampleURI = 'ipfs://myipfshash/';
  const examplePrime = new BN('911');
  const minVal = new BN('75000000000000000');

  if (process.env.FULL == 'true') {
    fullMint = true;
  } else {
    fullMint = false;
  }

  beforeEach(async function () {
    this.gbs = await GoodBoiSociety.new({from: owner});
  });

  // confirm default checks

  it('sales are active upon launch', async function () {
    await expect(
      await this.gbs.saleIsActive()
    ).to.equal(true);
  });

  // ownership checks

  it('non owner cannot withdraw contract funds', async function () {
    await expectRevert(
      this.gbs.withdraw({from: other}),
      'Ownable: caller is not the owner',
    );
  });

  it('non owner cannot pause and resume sales', async function () {
    await expectRevert(
      this.gbs.pauseSale({from: other}),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.gbs.resumeSale({from: other}),
      'Ownable: caller is not the owner',
    );
  });

  it('non owner cannot set the random prime number or base URI', async function () {
    await expectRevert(
      this.gbs.setRandPrime(911, {from: other}),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.gbs.setBaseURI("ipfs://mynewhash", {from: other}),
      'Ownable: caller is not the owner',
    );
  });

  // pause/resumeSale func checks

  it('pauseSale function sets saleIsActive var to false', async function () {
    await this.gbs.pauseSale();
    await expect(
      await this.gbs.saleIsActive()
    ).to.equal(false);
  });

  it('resumeSale function sets saleIsActive var to false', async function () {
    await this.gbs.pauseSale();
    await this.gbs.resumeSale();
    await expect(
      await this.gbs.saleIsActive()
    ).to.equal(true);
  });

  // setRandPrime func checks

  it('setRandPrime function will set RAND_PRIME variable', async function () {
    await this.gbs.setRandPrime(examplePrime);
    await expect(
      await this.gbs.RAND_PRIME()
    ).to.be.bignumber.equal(examplePrime);
  });

  it('setRandPrime function will only allow being set one time', async function () {
    await this.gbs.setRandPrime(examplePrime);
    await this.gbs.setRandPrime(unsetPrime);
    await expect(
      await this.gbs.RAND_PRIME()
    ).to.be.bignumber.equal(examplePrime);
  });

  // setBaseURI func checks

  it('setBaseURI function will set new metadata URI for NFTs', async function () {
    await this.gbs.setBaseURI(exampleURI);
    await expect(
      await this.gbs.tokenURI(1)
    ).to.equal(exampleURI + '1');
    await expect(
      await this.gbs.tokenURI(9999)
    ).to.equal(exampleURI + '9999');
  });

  // checkTokenIsMinted func checks

  it('checkTokenIsMinted function will return false for unminted token Ids', async function () {
    await expect(
      await this.gbs.checkTokenIsMinted(1)
    ).to.equal(false);
  });

  it('checkTokenIsMinted function will return true for minted token Ids', async function () {
    await this.gbs.setRandPrime(examplePrime);
    await this.gbs.mintDoge(1, {value: minVal});
    let tokenId = await this.gbs.getTokenId(1);
    await expect(
      await this.gbs.checkTokenIsMinted(tokenId)
    ).to.equal(true);
  });

  it('checkTokenIsMinted function will revert if provided Id is outside of expected range', async function () {
    await expectRevert(
      this.gbs.checkTokenIsMinted(10000),
      'Provided tokenId is not allowed'
    );
  });

  // checkIndexIsMinted func checks

  it('checkIndexIsMinted function will return false for unminted token indexes', async function () {
    await expect(
      await this.gbs.checkIndexIsMinted(1)
    ).to.equal(false);
  });

  it('checkIndexIsMinted function will return true for minted token indexes', async function () {
    await this.gbs.setRandPrime(examplePrime);
    await this.gbs.mintDoge(1, {value: minVal});
    await expect(
      await this.gbs.checkIndexIsMinted(1)
    ).to.equal(true);
  });

  it('checkIndexIsMinted function will revert if provided index is outside of expected range', async function () {
    await expectRevert(
      this.gbs.checkIndexIsMinted(10000),
      'Provided token index is not allowed'
    );
  });

  // mintDoge func checks

  it('mintDoge function will revert if RAND_PRIME not set', async function () {
    await expectRevert(
      this.gbs.mintDoge(1, {value: minVal}),
      'Random prime number has not been defined in the contract'
    );
  });

  it('mintDoge function will revert if saleIsActive is false', async function () {
    await this.gbs.setRandPrime(examplePrime);
    await this.gbs.pauseSale();
    await expect(
      await this.gbs.saleIsActive()
    ).to.equal(false);
    await expectRevert(
      this.gbs.mintDoge(1, {value: minVal}),
      'Sale must be active to mint Doges'
    );
  });

  it('mintDoge function will revert if numberOfTokens arg exceeds 20', async function () {
    await this.gbs.setRandPrime(examplePrime);
    await expectRevert(
      this.gbs.mintDoge(25, {value: minVal * 25}),
      'Can only mint 20 Doges at a time'
    );
  });

  it('mintDoge function will revert if not enough ETH sent', async function () {
    await this.gbs.setRandPrime(examplePrime);
    await expectRevert(
      this.gbs.mintDoge(1, {value: minVal * .99}),
      'Ether value sent is not correct'
    );
    await expectRevert(
      this.gbs.mintDoge(5, {value: (minVal * 5) * .99}),
      'Ether value sent is not correct'
    );
  });

  it('mintDoge function will loop and mint appropriate amount of doges', async function () {
    await this.gbs.setRandPrime(examplePrime);
    await this.gbs.mintDoge(20, {value: minVal * 20})
    await expect(
      (await this.gbs.totalSupply()).toString()
    ).to.equal('20');
    await this.gbs.mintDoge(20, {value: minVal * 20})
    await expect(
      (await this.gbs.totalSupply()).toString()
    ).to.equal('40');
    await this.gbs.mintDoge(5, {value: minVal * 5})
    await expect(
      (await this.gbs.totalSupply()).toString()
    ).to.equal('45');
    await this.gbs.mintDoge(1, {value: minVal})
    await expect(
      (await this.gbs.totalSupply()).toString()
    ).to.equal('46');
  });

  it('mintDoge function will mint only up to 9999 doges', async function () {
    this.timeout(0); // dont timeout for this long test
    if (fullMint) {
      await this.gbs.setRandPrime(examplePrime);
      for (i = 0; i < 9999; i++) {
        let res = await this.gbs.mintDoge(1, {value: minVal});
        let tokenIndex = (await this.gbs.totalSupply()).toString();
        let tokenId = (await this.gbs.getTokenId(tokenIndex)).toString();
        let timestamp = (await this.gbs.TIMESTAMP()).toString();
        // console.log(`Minted token index ${tokenIndex} at ${tokenId}! Timestamp: ${timestamp} - Prime: ${examplePrime}`);
        await expectEvent(
          res, 'Transfer'
        );
      }
      await expect(
        (await this.gbs.totalSupply()).toString()
      ).to.equal('9999');
      await expectRevert(
        this.gbs.mintDoge(1, {value: minVal}),
        'Purchase would exceed max supply of Doges'
      );
    }
  });

});
