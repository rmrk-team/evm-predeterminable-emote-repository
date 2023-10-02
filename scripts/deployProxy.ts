import { bytecode } from "../artifacts/contracts/EmoteRepository.sol/EmoteRepository.json";
import { ethers, run } from "hardhat";
import { Wallet } from "ethers";
import { delay } from "@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService";

async function main() {
  console.log("Deploying DeployProxy...");
  const prefundedAddress = (await ethers.getSigners())[0];
  const deployer = new Wallet(
    process.env.REPOSITORY_DEPLOYER || "",
    prefundedAddress.provider
  );
  console.log(`Deployer Address: ${await deployer.getAddress()}`);

  await prefundedAddress.sendTransaction({
    to: deployer.address,
    value: ethers.utils.parseEther("1.0"),
  });

  const DeployProxy = await ethers.getContractFactory("DeployProxy");
  const deployProxy = await DeployProxy.connect(deployer).deploy(); // Used for the networks where the deploy proxy is not deployed to
  // const deployProxy = DeployProxy.attach('0xe68fe566f9585c08F0123F92f111F6a3c00f6660'); // Used for the networks where the deploy proxy is already deployed to

  await deployProxy.deployed();
  console.log(`DeployProxy deployed to: ${deployProxy.address}`);

  const initCode = bytecode;

  const saltHex = ethers.utils.id("73968130");

  const repositoryDeploy = await deployProxy
    .connect(deployer)
    .deployContract(initCode, saltHex);
  const transactionReceipt = await repositoryDeploy.wait();
  const repositoryAddress = transactionReceipt.events[0].args[0];

  console.log(`Deployed EmoteRepository to: ${repositoryAddress}`);

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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
