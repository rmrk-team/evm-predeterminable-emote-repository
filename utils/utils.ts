import { ethers } from "hardhat";

export async function encoder(types: string[], values: any[]) {
    const abiCoder = ethers.utils.defaultAbiCoder;
    const encodedParams = abiCoder.encode(types, values);
    return encodedParams.slice(2);
}

export async function create2Address(factoryAddress: string, saltHex: string, initCode: string) {
    const create2Addr = ethers.utils.getCreate2Address(factoryAddress, saltHex, ethers.utils.keccak256(initCode));
    return create2Addr;
}
