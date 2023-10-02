import { HardhatRuntimeEnvironment } from "hardhat/types";
import { task } from "hardhat/config";
import { Wallet } from "ethers";
import { bytecode } from "../artifacts/contracts/EmoteRepository.sol/EmoteRepository.json";

async function create2Address(
  factoryAddress: string,
  saltHex: string,
  initCode: string,
  ethers: any
) {
  const create2Addr = ethers.utils.getCreate2Address(
    factoryAddress,
    saltHex,
    ethers.utils.keccak256(initCode)
  );
  return create2Addr;
}

task(
  "calculateSalt",
  "Search for the salt resulting into desired address within the given range"
)
  .addPositionalParam("start")
  .addPositionalParam("end")
  .setAction(async (params, hre: HardhatRuntimeEnvironment) => {
    await calculateSaltInRange(
      parseInt(params["start"]),
      parseInt(params["end"]),
      hre.ethers
    );
  });

async function calculateSaltInRange(start: number, end: number, ethers: any) {
  console.log("Deploying DeployProxy...");

  const funder = (await ethers.getSigners())[0];
  const deployer = new Wallet(
    process.env.REPOSITORY_DEPLOYER || "",
    funder.provider
  );

  console.log(`Deployer Address: ${await deployer.getAddress()}`);

  // This is a utility to get the deployer to have some ETH to deploy the contract in the Hardhat's emualted network
  await funder.sendTransaction({
    to: deployer.address,
    value: ethers.utils.parseEther("1.0"),
  });

  const DeployProxy = await ethers.getContractFactory("DeployProxy");
  const deployProxy = await DeployProxy.connect(deployer).deploy(); // Used for the networks where the deploy proxy is not deployed to

  await deployProxy.deployed();
  console.log(`DeployProxy deployed to: ${deployProxy.address}`);

  console.log("Calculating salt...");

  // // This is used to find the saltHex that will generate the create2 address that starts with 3110735
  let saltHex = ethers.utils.id(start.toString());
  // i used to generate the saltHex resulting in 0x311073558990afC92E42C966EEAEa3018251c01d is 73968130
  for (let i = start; i < end; i++) {
    const create2Addr = await create2Address(
      deployProxy.address,
      saltHex,
      bytecode,
      ethers
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
}
