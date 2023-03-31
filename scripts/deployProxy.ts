import { bytecode } from "../artifacts/contracts/EmoteRepository.sol/EmoteRepository.json";
import { ethers } from "hardhat";
import { create2Address } from "../utils/utils";
import { Wallet } from "ethers";

async function main() {
    console.log("Deploying DeployProxy...");

    // const deployer = await ethers.getSigner("0xbfa07ae67d7085b72352ff480bde8ce8705d9e27");
    // console.log(deployer.address);

    const prefundedAddress = await ethers.getSigners();
    const deployer = new Wallet(process.env.REPOSITORY_DEPLOYER, prefundedAddress[0].provider);
    console.log(`Deployer Address: ${deployer.address}`);

    // This is a utility to get the deployer to have some ETH to deploy the contract in the Hardhat's emualted network
    const [fundedAddress] = await ethers.getSigners();
    await fundedAddress.sendTransaction({ to: deployer.address, value: ethers.utils.parseEther("1.0") });

    const DeployProxy = await ethers.getContractFactory("DeployProxy");
    const deployProxy = await DeployProxy.connect(deployer).deploy();

    await deployProxy.deployed();
    console.log(`DeployProxy deployed to: ${deployProxy.address}`);

    const initCode = bytecode;

    // This is used to find the saltHex that will generate the create2 address that starts with 0x311073
    let saltHex = ethers.utils.id("0");
    // i used to generate the saltHex resulting in 0x311073D39F5ef05981ff11a61fEB6440E203a343 is 110645378
    // The saltHex is generated using ethers.utils.id(i.toString())
    // The saltHex is 0xb7484dc9eb8239ebbd47c365e792cd20f0fa105342d01e989ad0d66512bedd02
    for(let i = 100000000; i < 200000000; i++) {
        // console.log(`Salt: ${saltHex}`);
        const create2Addr = await create2Address(deployProxy.address, saltHex, initCode);
        // console.log(`Precomputed create2 Address: ${create2Addr}`);
        console.log(create2Addr.slice(2, 8));
        if(create2Addr.slice(2, 8) === "311073"){
            console.log("Found!");
            console.log(`Salt: ${saltHex}`);
            console.log(`Precomputed create2 Address: ${create2Addr}`);
            console.log(`i is: ${i}`);
            break;
        }
        saltHex = ethers.utils.id((i + 1).toString());
    }

    // const saltHex = ethers.utils.id("110645378");

    const repositoryDeploy = await deployProxy.connect(deployer).deployContract(initCode, saltHex);
    const transactionReceipt = await repositoryDeploy.wait();
    console.log(`Deployed EmoteRepository to: ${transactionReceipt.events[0].args[0]}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});