// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.18;

contract DeployProxy {
    event NewContract(address addr);

    function deployContract(bytes memory bytecode, uint256 salt) public {
        address addr;
        assembly {
            addr := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }

        emit NewContract(addr);
    }
}
