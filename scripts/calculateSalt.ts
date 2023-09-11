import { bytecode } from "../artifacts/contracts/AttributesRepository.sol/AttributesRepository.json";
import { ethers } from "hardhat";
import { create2Address } from "../utils/utils";
import { Wallet, Signer } from "ethers";

async function main() {
    console.log("Deploying DeployProxy...");

    const prefundedAddress = await ethers.getSigners();
    const deployer = new Wallet(process.env.REPOSITORY_DEPLOYER, prefundedAddress[0].provider);
    // const accounts: Signer[] = await ethers.getSigners();
    // const deployer = accounts[0];
    console.log(`Deployer Address: ${await deployer.getAddress()}`);

    // This is a utility to get the deployer to have some ETH to deploy the contract in the Hardhat's emualted network
    const [fundedAddress] = await ethers.getSigners();
    await fundedAddress.sendTransaction({ to: deployer.address, value: ethers.utils.parseEther("1.0") });

    const DeployProxy = await ethers.getContractFactory("DeployProxy");
    const deployProxy = await DeployProxy.connect(deployer).deploy(); // Used for the networks where the deploy proxy is not deployed to
    // const deployProxy = DeployProxy.attach('0xe68fe566f9585c08F0123F92f111F6a3c00f6660'); // Used for the networks where the deploy proxy is already deployed to

    await deployProxy.deployed();
    console.log(`DeployProxy deployed to: ${deployProxy.address}`);

    const initCode = bytecode;

    console.log('Calculating salt...');

    // // This is used to find the saltHex that will generate the create2 address that starts with 0xA77B75
    let saltHex = ethers.utils.id("0");
    // // i used to generate the saltHex resulting in 0xA77B75d87e29F0DA32b27566A375574Efc193cD5 is 7801454
    // // The saltHex is generated using ethers.utils.id(i.toString())
    // // The saltHex is 0xaac49629c7d45e9387df9a6bf21aacf972f60c8650ed9ce4a4da9477f6321097
    for(let i = 0; i < 1000000000; i++) {
        // console.log(`Salt: ${saltHex}`);
        const create2Addr = await create2Address(deployProxy.address, saltHex, initCode);
        // console.log(`Precomputed create2 Address: ${create2Addr}`);
        console.log(`i is: ${i}`);
        console.log(create2Addr.slice(2, 8));
        if(create2Addr.slice(2, 8) === "A77B75"){
            console.log("Found!");
            console.log(`Salt: ${saltHex}`);
            console.log(`Precomputed create2 Address: ${create2Addr}`);
            console.log(`i is: ${i}`);
            break;
        }
        saltHex = ethers.utils.id((i + 1).toString());
    }

    // const saltHex = ethers.utils.id("7801454");

    const repositoryDeploy = await deployProxy.connect(deployer).deployContract(initCode, saltHex);
    const transactionReceipt = await repositoryDeploy.wait();

    const repositoryAddress = transactionReceipt.events[0].args[0];

    console.log(`Deployed AttributesRepository to: ${repositoryAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});