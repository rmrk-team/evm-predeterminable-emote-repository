import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  gasReporter: {
    currency: "EUR",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    enabled: true
  },
  networks: {
    goerli: {
      url: process.env.GOERLI_URL,
      accounts: process.env.REPOSITORY_DEPLOYER !== undefined ? [process.env.REPOSITORY_DEPLOYER] : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: process.env.REPOSITORY_DEPLOYER !== undefined ? [process.env.REPOSITORY_DEPLOYER] : [],
    },
    mumbai: {
      url: process.env.MUMBAI_URL,
      accounts: process.env.REPOSITORY_DEPLOYER !== undefined ? [process.env.REPOSITORY_DEPLOYER] : [],
    },
    moonbaseAlpha: {
      url: 'https://moonbeam-alpha.api.onfinality.io/public',
      chainId: 1287,
      accounts: process.env.REPOSITORY_DEPLOYER !== undefined ? [process.env.REPOSITORY_DEPLOYER] : [],
      gasPrice: 1000000000,
    },
  },
  etherscan: {
    apiKey: {
      goerli: process.env.GOERLI_ETHERSCAN_API_KEY || "",
      sepolia: process.env.SEPOLIA_ETHERSCAN_API_KEY || "",
      polygonMumbai: process.env.MUMBAI_ETHERSCAN_API_KEY || "",
      moonbaseAlpha: process.env.MOONBEAM_MOONSCAN_APIKEY || "",
    }
  },
};

export default config;
