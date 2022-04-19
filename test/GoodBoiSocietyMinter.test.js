// test/GoodBoiSociety.test.js
const { expect } = require('chai');
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const GoodBoiSociety = artifacts.require('GoodBoiSociety');
const GoodBoiSocietyMinter = artifacts.require('GoodBoiSocietyMinter');

// Start test block
contract('GoodBoiSociety', function ([owner, other]) {

  const examplePrime = new BN('911');
  const minVal = new BN('75000000000000000');

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
    await this.gbs.transferOwnership(this.gbsm.address);
    web3.eth.sendTransaction({from: owner, to: this.gbsm.address, value: web3.utils.toWei('.225', 'ether')});
    web3.eth.getBalance(this.gbsm.address);
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

  // it('mintDoge function will revert if not enough ETH sent', async function () {
  //   await this.gbs.setRandPrime(examplePrime);
  //   await expectRevert(
  //     this.gbs.mintDoge(1, {value: minVal * .99}),
  //     'Ether value sent is not correct'
  //   );
  //   await expectRevert(
  //     this.gbs.mintDoge(5, {value: (minVal * 5) * .99}),
  //     'Ether value sent is not correct'
  //   );
  // });
  //
  // it('mintDoge function will loop and mint appropriate amount of doges', async function () {
  //   await this.gbs.setRandPrime(examplePrime);
  //   await this.gbs.mintDoge(20, {value: minVal * 20})
  //   await expect(
  //     (await this.gbs.totalSupply()).toString()
  //   ).to.equal('20');
  //   await this.gbs.mintDoge(20, {value: minVal * 20})
  //   await expect(
  //     (await this.gbs.totalSupply()).toString()
  //   ).to.equal('40');
  //   await this.gbs.mintDoge(5, {value: minVal * 5})
  //   await expect(
  //     (await this.gbs.totalSupply()).toString()
  //   ).to.equal('45');
  //   await this.gbs.mintDoge(1, {value: minVal})
  //   await expect(
  //     (await this.gbs.totalSupply()).toString()
  //   ).to.equal('46');
  // });
  //
  // it('mintDoge function will mint only up to 9999 doges', async function () {
  //   this.timeout(0); // dont timeout for this long test
  //   if (fullMint) {
  //     await this.gbs.setRandPrime(examplePrime);
  //     for (i = 0; i < 9999; i++) {
  //       let res = await this.gbs.mintDoge(1, {value: minVal});
  //       let tokenIndex = (await this.gbs.totalSupply()).toString();
  //       let tokenId = (await this.gbs.getTokenId(tokenIndex)).toString();
  //       let timestamp = (await this.gbs.TIMESTAMP()).toString();
  //       // console.log(`Minted token index ${tokenIndex} at ${tokenId}! Timestamp: ${timestamp} - Prime: ${examplePrime}`);
  //       await expectEvent(
  //         res, 'Transfer'
  //       );
  //     }
  //     await expect(
  //       (await this.gbs.totalSupply()).toString()
  //     ).to.equal('9999');
  //     await expectRevert(
  //       this.gbs.mintDoge(1, {value: minVal}),
  //       'Purchase would exceed max supply of Doges'
  //     );
  //   }
  // });

});
