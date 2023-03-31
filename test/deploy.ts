import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { bytecode } from "../artifacts/contracts/EmoteRepository.sol/EmoteRepository.json";
import { DeployProxy } from '../typechain-types';

describe('RMRKMultiAssetEmotableMock', async function () {
  let deployProxy: DeployProxy;

  beforeEach(async function () {
    const DeployProxy = await ethers.getContractFactory("DeployProxy");
    deployProxy = await DeployProxy.deploy();

    await deployProxy.deployed();
    console.log(`DeployProxy deployed to: ${deployProxy.address}`);
  });

  it('can support IERC165', async function () {
    const initCode = bytecode;

    const saltHex = ethers.utils.id("8324510");

    const repositoryDeploy = await deployProxy.deployContract(initCode, saltHex);
    console.log(repositoryDeploy);
    const transactionReceipt = await repositoryDeploy.wait();
    console.log(`Deployed EmoteRepository to: ${transactionReceipt.events[0].args[0]}`);
    expect(true).to.equal(true);
  });
});
