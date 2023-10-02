import { bytecode } from "../artifacts/contracts/EmoteRepository.sol/EmoteRepository.json";
import { ethers } from "hardhat";
import { create2Address } from "../utils/utils";
import { Wallet } from "ethers";

async function main() {
  console.log("Deploying DeployProxy...");

  const prefundedAddress = (await ethers.getSigners())[0];
  const deployer = new Wallet(
    process.env.REPOSITORY_DEPLOYER || "",
    prefundedAddress.provider
  );

  console.log(`Deployer Address: ${await deployer.getAddress()}`);

  // This is a utility to get the deployer to have some ETH to deploy the contract in the Hardhat's emualted network
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

  console.log("Calculating salt...");

  // // This is used to find the saltHex that will generate the create2 address that starts with 0xA77B75
  let saltHex = ethers.utils.id("0");
  // // i used to generate the saltHex resulting in 0x311073558990afC92E42C966EEAEa3018251c01d is 73968130
  for (let i = 0; i < 10000000; i++) {
    const create2Addr = await create2Address(
      deployProxy.address,
      saltHex,
      initCode
    );
    if (i % 100000 === 0) {
      console.log(`i is: ${i}`);
    }
    if (create2Addr.slice(2, 9).toUpperCase() === "3110735") {
      console.log("Found!");
      console.log(`Salt: ${saltHex}`);
      console.log(`Precomputed create2 Address: ${create2Addr}`);
      console.log(`i is: ${i}`);
      break;
    }
    saltHex = ethers.utils.id((i + 1).toString());
  }

  // Deploying just for fun:
  const repositoryDeploy = await deployProxy
    .connect(deployer)
    .deployContract(initCode, saltHex);
  const transactionReceipt = await repositoryDeploy.wait();

  const repositoryAddress = transactionReceipt.events[0].args[0];

  console.log(`Deployed EmoteRepository to: ${repositoryAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
