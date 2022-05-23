// test/GoodBoiSociety.test.js
const { expect } = require('chai');
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const GoodBoiSociety = artifacts.require('GoodBoiSociety');
const GoodBoiSocietyMinter = artifacts.require('GoodBoiSocietyMinter');

// Start test block
contract('GoodBoiSociety', function ([owner, other]) {

  const examplePrime = new BN('911');
  const minVal = new BN('75000000000000000');
  const minValInt = '75000000000000000';

  if (process.env.FULL == 'true') {
    fullMint = true;
  } else {
    fullMint = false;
  }

  beforeEach(async function () {
    this.gbs = await GoodBoiSociety.new({from: owner});
    this.gbsm = await GoodBoiSocietyMinter.new(this.gbs.address, {from: owner});
    await this.gbs.setRandPrime(examplePrime);
    await this.gbs.mintDoge(1, {value: minVal});
  });

  // confirm default checks

  it('minting is paused upon launch', async function () {
    await expect(
      await this.gbsm.MINTABLE()
    ).to.equal(false);
  });

  it('contract matches original upon launch', async function () {
    await expect(
      await this.gbsm.ORIGINAL_CONTRACT()
    ).to.equal(await this.gbs.address);
  });

  // ownership checks

  it('non owner cannot withdraw contract funds', async function () {
    await expectRevert(
      this.gbsm.withdraw(0, {from: other}),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.gbsm.setMintable(true, {from: other}),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.gbsm.setTargetContract(this.gbs.address, {from: other}),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.gbsm.reclaimOwnership({from: other}),
      'Ownable: caller is not the owner',
    );
  });

  // state checks

  it('setMintable function changes contract mintable state', async function () {
    await expect(
      await this.gbsm.MINTABLE()
    ).to.equal(false);
    await this.gbsm.setMintable(true);
    await expect(
      await this.gbsm.MINTABLE()
    ).to.equal(true);
    await this.gbsm.setMintable(false);
    await expect(
      await this.gbsm.MINTABLE()
    ).to.equal(false);
  });

  // ownership checks

  it('can take control of old contract to new contract and then reclaim original owner', async function () {
    // owner of GBS is original deployer
    await expect(
      await this.gbs.owner()
    ).to.equal(owner);
    // assume ownership to new contract
    await this.gbs.transferOwnership(this.gbsm.address);
    // owner of GBS should be the new contract itself
    await expect(
      await this.gbs.owner()
    ).to.equal(this.gbsm.address);
    // transfer ownership back to the deployer
    await this.gbsm.reclaimOwnership();
    await expect(
      await this.gbs.owner()
    ).to.equal(owner);
  });

  // refuel checks
  it('contract can refuel if not enough balance', async function () {
    // send .225 ether to original contract
    // mint 1 doge on minter contract
    // should refuel on empty balance the .225 - .075 for 1 mint
    // original contract balance will be 0
    // minter contract balance will be .15
    let weiAmt = web3.utils.toWei('.225', 'ether');
    let weiAmtNew = web3.utils.toWei('.15', 'ether');
    let allAmt = web3.utils.toWei('.3', 'ether');
    await this.gbs.transferOwnership(this.gbsm.address);
    await this.gbs.mintDoge(3, {value: weiAmt});
    await this.gbsm.setMintable(true);
    await this.gbsm.mint(1);
    // .225, .075
    await expect(
      await web3.eth.getBalance(this.gbsm.address)
    ).to.equal(weiAmt);
    await expect(
      await web3.eth.getBalance(this.gbs.address)
    ).to.equal(minValInt);
    await this.gbsm.mint(3);
    // 0, .3
    await expect(
      await web3.eth.getBalance(this.gbsm.address)
    ).to.equal('0');
    await expect(
      await web3.eth.getBalance(this.gbs.address)
    ).to.equal(allAmt);
  })

  // minting checks

  it('minting will revert if MINTABLE is false', async function () {
    await expectRevert(
      this.gbsm.mint(1),
      'Contract is not currently mintable.'
    );
  });

  it('minting will revert if more than max (3) requested', async function () {
    await this.gbsm.setMintable(true);
    await expectRevert(
      this.gbsm.mint(4, {value: minVal * 4}),
      'Would exceed max per mint.'
    );
  });

  it('mint function will loop and mint appropriate amount of doges', async function () {
    await expect(
      (await this.gbs.totalSupply()).toString()
    ).to.equal('1');
    await this.gbs.transferOwnership(this.gbsm.address);
    await this.gbsm.setMintable(true);
    await this.gbsm.mint(1);
    await this.gbsm.mint(1);
    await expect(
      (await this.gbs.totalSupply()).toString()
    ).to.equal('3');
    await this.gbsm.mint(1);
    await expect(
      (await this.gbs.totalSupply()).toString()
    ).to.equal('4');
  });

  it('mint function will mint 9999 doges and then pause', async function () {
    this.timeout(0); // dont timeout for this long test
    if (fullMint) {
      let weiAmt = web3.utils.toWei('.225', 'ether');
      await this.gbs.mintDoge(3, {value: weiAmt});
      await this.gbs.transferOwnership(this.gbsm.address);
      await this.gbsm.setMintable(true);
      for (i = 0; i < 3332; i++) {
        let res = await this.gbsm.mint(3);
        let supply = (await this.gbs.totalSupply()).toString();
        console.log(supply);
      }
      await expect(
        (await this.gbs.totalSupply()).toString()
      ).to.equal('9997');
      await expectRevert(
        await this.gbsm.mint(3),
        'Would exceed max supply.'
      );
      await this.gbsm.mint(2);
      await expect(
        (await this.gbs.totalSupply()).toString()
      ).to.equal('9999');
      await expect(
        await this.gbsm.MINTABLE()
      ).to.equal(false);
      // transfer ownership back to the deployer
      await this.gbsm.reclaimOwnership();
      await expect(
        await this.gbs.owner()
      ).to.equal(owner);
    }
  });

});
