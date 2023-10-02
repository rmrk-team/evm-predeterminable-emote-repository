import { BigNumber } from "ethers";
import { bytecode } from "../artifacts/contracts/EmoteRepository.sol/EmoteRepository.json";
import { delay } from "@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService";
import { DeployProxy } from "../typechain-types";
import { ethers, network, run } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Wallet } from "ethers";
import { getContractAddress } from "ethers/lib/utils";

async function main() {
  console.log("Deploying DeployProxy...");
  const funder = (await ethers.getSigners())[0];
  const deployer = new Wallet(
    process.env.REPOSITORY_DEPLOYER || "",
    ethers.provider
  );
  console.log(`Funder Address: ${funder.address}`);
  console.log(`Deployer Address: ${deployer.address}`);

  const deployerProxyAddress = getContractAddress({
    from: deployer.address,
    nonce: 0,
  });

  const DeployProxy = await ethers.getContractFactory("DeployProxy");
  let deployProxy: DeployProxy;
  try {
    const code = await ethers.provider.getCode(deployerProxyAddress);
    if (code !== "0x") {
      // DeployerProxy is already deployed
      deployProxy = DeployProxy.attach(deployerProxyAddress);
    } else {
      const transactionCount = await deployer.getTransactionCount();
      if (transactionCount > 0) {
        console.log(
          "ERROR! Deployer already deployed a contract and it was not the deployer proxy. Due to nonce, the deployer proxy cannot be deployed to the expected address."
        );
        return;
      }
      await sendGasFromFunder(deployer, funder, BigNumber.from(143077)); // 143077 is the gas estimation for deploying the contract, taken from gas report on tests
      deployProxy = await DeployProxy.connect(deployer).deploy(); // Used for the networks where the deploy proxy is not deployed to
      await deployProxy.deployed();
    }
  } catch (error) {
    console.log(error);
    return;
  }

  console.log(`DeployProxy deployed to: ${deployProxy.address}`);

  const saltHex = ethers.utils.id("73968130");
  const gasEstimation = await deployProxy.estimateGas.deployContract(
    bytecode,
    saltHex
  );
  await sendGasFromFunder(deployer, funder, gasEstimation);

  console.log("Deploying EmoteRepository...");
  const repositoryDeploy = await deployProxy
    .connect(deployer)
    .deployContract(bytecode, saltHex, {
      gasPrice: network.config.gasPrice,
      gasLimit: gasEstimation,
    });
  const transactionReceipt = await repositoryDeploy.wait();
  const repositoryAddress = transactionReceipt.events[0].args[0];

  console.log(`Deployed EmoteRepository to: ${repositoryAddress}`);
  console.log("Waiting for 60 seconds before verifying...");
  await delay(60000);

  try {
    await run("verify:verify", {
      address: repositoryAddress,
      constructorArguments: [],
    });
  } catch (error) {
    console.log(error);
  }
}

async function sendGasFromFunder(
  deployer: Wallet,
  funder: SignerWithAddress,
  gasEstimation: BigNumber
) {
  const totalGasPrice = gasEstimation
    .mul(network.config.gasPrice)
    .mul(105)
    .div(100);
  const deployerBalance = await deployer.getBalance();
  const funderBalance = await funder.getBalance();
  console.log(`Gas Estimation: ${gasEstimation.toString()}`);
  console.log(`Gas Price Needed: ${totalGasPrice.toString()}`);
  console.log(`Deployer Balance: ${deployerBalance}`);
  console.log(`Funder Balance: ${funderBalance}`);

  // return;

  if (deployerBalance.lt(totalGasPrice)) {
    const missingGas = totalGasPrice.sub(deployerBalance);
    if (funderBalance.lt(missingGas)) {
      console.log(
        "Funder does not have enough gas to complete gas needed on deployer"
      );
      return;
    }
    console.log("Sending gas from funder to deployer...");
    let tx = await funder.sendTransaction({
      to: deployer.address,
      value: missingGas,
    });
    await tx.wait();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
