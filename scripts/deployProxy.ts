import { bytecode } from "../artifacts/contracts/EmoteRepository.sol/EmoteRepository.json";
import { ethers, run } from "hardhat";
import { create2Address } from "../utils/utils";
import { Wallet, Signer } from "ethers";
import { delay } from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';

async function main() {
    console.log("Deploying DeployProxy...");

    // const deployer = await ethers.getSigner("0xbfa07ae67d7085b72352ff480bde8ce8705d9e27");
    // console.log(deployer.address);

    // const prefundedAddress = await ethers.getSigners();
    // const deployer = new Wallet(process.env.REPOSITORY_DEPLOYER, prefundedAddress[0].provider);
    const accounts: Signer[] = await ethers.getSigners();
    const deployer = accounts[0];
    console.log(`Deployer Address: ${await deployer.getAddress()}`);

    // This is a utility to get the deployer to have some ETH to deploy the contract in the Hardhat's emualted network
    // const [fundedAddress] = await ethers.getSigners();
    // await fundedAddress.sendTransaction({ to: deployer.address, value: ethers.utils.parseEther("1.0") });

    const DeployProxy = await ethers.getContractFactory("DeployProxy");
    const deployProxy = await DeployProxy.connect(deployer).deploy();

    await deployProxy.deployed();
    console.log(`DeployProxy deployed to: ${deployProxy.address}`);

    const initCode = bytecode;

    // // This is used to find the saltHex that will generate the create2 address that starts with 0x311073
    // let saltHex = ethers.utils.id("0");
    // // i used to generate the saltHex resulting in 0x311073569e12F7770719497CD3B3Aa2dB0a0C3D9 is 676716932
    // // The saltHex is generated using ethers.utils.id(i.toString())
    // // The saltHex is 0x08ba3eb72a925ffd587a16e1b76c46ed4096f9cae84e2be8c1a1dfeecc6519f2
    // for(let i = 0; i < 1000000000; i++) {
    //     // console.log(`Salt: ${saltHex}`);
    //     const create2Addr = await create2Address(deployProxy.address, saltHex, initCode);
    //     // console.log(`Precomputed create2 Address: ${create2Addr}`);
    //     console.log(create2Addr.slice(2, 9));
    //     if(create2Addr.slice(2, 9) === "3110735"){
    //         console.log("Found!");
    //         console.log(`Salt: ${saltHex}`);
    //         console.log(`Precomputed create2 Address: ${create2Addr}`);
    //         console.log(`i is: ${i}`);
    //         break;
    //     }
    //     saltHex = ethers.utils.id((i + 1).toString());
    // }

    const saltHex = ethers.utils.id("676716932");

    const repositoryDeploy = await deployProxy.connect(deployer).deployContract(initCode, saltHex);
    const transactionReceipt = await repositoryDeploy.wait();

    const repositoryAddress = transactionReceipt.events[0].args[0];

    console.log(`Deployed EmoteRepository to: ${repositoryAddress}`);

    await delay(60000);

    try {
        await run('verify:verify', {
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