const fs = require('fs');
const path = require('path');

async function updateConfigurations(network, contractAddress) {
  console.log(`正在更新配置文件中的合约地址...`);
  
  const updates = [];

  // 1. 更新前端配置
  const frontendConfigPath = path.join(__dirname, '../../frontend/lib/smart-contracts.ts');
  if (fs.existsSync(frontendConfigPath)) {
    try {
      let frontendConfig = fs.readFileSync(frontendConfigPath, 'utf8');
      
      // 更新合约地址配置
      const contractAddressRegex = /HACKX_CORE_ADDRESS:\s*{[^}]*}/s;
      const newContractConfig = `HACKX_CORE_ADDRESS: {
    [${getChainId(network)}]: '${contractAddress}'
  }`;
      
      if (contractAddressRegex.test(frontendConfig)) {
        frontendConfig = frontendConfig.replace(contractAddressRegex, newContractConfig);
      } else {
        // 如果配置不存在，添加到文件末尾
        frontendConfig += `\n\nexport const HACKX_CORE_ADDRESS: { [key: number]: string } = {\n  [${getChainId(network)}]: '${contractAddress}'\n};\n`;
      }
      
      fs.writeFileSync(frontendConfigPath, frontendConfig);
      updates.push(`✅ 前端配置已更新: ${frontendConfigPath}`);
    } catch (error) {
      updates.push(`❌ 更新前端配置失败: ${error.message}`);
    }
  }

  // 2. 更新子图配置
  const subgraphConfigPath = path.join(__dirname, '../../subgraph/subgraph.yaml');
  if (fs.existsSync(subgraphConfigPath)) {
    try {
      let subgraphConfig = fs.readFileSync(subgraphConfigPath, 'utf8');
      
      // 更新合约地址
      const addressRegex = /address:\s*["'][^"']*["']/;
      if (addressRegex.test(subgraphConfig)) {
        subgraphConfig = subgraphConfig.replace(addressRegex, `address: "${contractAddress}"`);
      }
      
      // 更新网络配置
      const networkRegex = /network:\s*\w+/;
      if (networkRegex.test(subgraphConfig)) {
        subgraphConfig = subgraphConfig.replace(networkRegex, `network: ${getSubgraphNetwork(network)}`);
      }
      
      fs.writeFileSync(subgraphConfigPath, subgraphConfig);
      updates.push(`✅ 子图配置已更新: ${subgraphConfigPath}`);
    } catch (error) {
      updates.push(`❌ 更新子图配置失败: ${error.message}`);
    }
  }

  // 3. 更新后端配置
  const backendConfigPath = path.join(__dirname, '../../backend/lib/smart-contracts.ts');
  if (fs.existsSync(backendConfigPath)) {
    try {
      let backendConfig = fs.readFileSync(backendConfigPath, 'utf8');
      
      // 类似前端配置更新
      const contractAddressRegex = /HACKX_CORE_ADDRESS:\s*{[^}]*}/s;
      const newContractConfig = `HACKX_CORE_ADDRESS: {
    [${getChainId(network)}]: '${contractAddress}'
  }`;
      
      if (contractAddressRegex.test(backendConfig)) {
        backendConfig = backendConfig.replace(contractAddressRegex, newContractConfig);
      } else {
        backendConfig += `\n\nexport const HACKX_CORE_ADDRESS: { [key: number]: string } = {\n  [${getChainId(network)}]: '${contractAddress}'\n};\n`;
      }
      
      fs.writeFileSync(backendConfigPath, backendConfig);
      updates.push(`✅ 后端配置已更新: ${backendConfigPath}`);
    } catch (error) {
      updates.push(`❌ 更新后端配置失败: ${error.message}`);
    }
  }

  // 4. 创建环境配置文件
  const envConfigPath = path.join(__dirname, '../../.env.production');
  try {
    const envConfig = `# 生产环境配置
NEXT_PUBLIC_HACKX_CORE_ADDRESS=${contractAddress}
NEXT_PUBLIC_CHAIN_ID=${getChainId(network)}
NEXT_PUBLIC_NETWORK_NAME=${network}
NEXT_PUBLIC_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/your-username/hackx-${network}

# IPFS配置
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
NEXT_PUBLIC_IPFS_API_URL=https://api.pinata.cloud

# 区块链配置
NEXT_PUBLIC_RPC_URL=${getRpcUrl(network)}
`;
    
    fs.writeFileSync(envConfigPath, envConfig);
    updates.push(`✅ 环境配置文件已创建: ${envConfigPath}`);
  } catch (error) {
    updates.push(`❌ 创建环境配置失败: ${error.message}`);
  }

  return updates;
}

function getChainId(network) {
  const chainIds = {
    mainnet: 1,
    polygon: 137,
    arbitrumOne: 42161,
    optimism: 10,
    sepolia: 11155111,
    polygonMumbai: 80001
  };
  return chainIds[network] || 1337;
}

function getSubgraphNetwork(network) {
  const subgraphNetworks = {
    mainnet: 'mainnet',
    polygon: 'matic',
    arbitrumOne: 'arbitrum-one',
    optimism: 'optimism',
    sepolia: 'sepolia',
    polygonMumbai: 'mumbai'
  };
  return subgraphNetworks[network] || 'mainnet';
}

function getRpcUrl(network) {
  const rpcUrls = {
    mainnet: 'https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY',
    polygon: 'https://polygon-mainnet.alchemyapi.io/v2/YOUR_API_KEY',
    arbitrumOne: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
    sepolia: 'https://eth-sepolia.alchemyapi.io/v2/YOUR_API_KEY',
    polygonMumbai: 'https://polygon-mumbai.alchemyapi.io/v2/YOUR_API_KEY'
  };
  return rpcUrls[network] || 'http://localhost:8545';
}

async function main() {
  // 读取部署信息
  const network = process.argv[2] || 'polygon';
  const contractAddress = process.argv[3];
  
  if (!contractAddress) {
    // 尝试从部署文件读取
    const deploymentFile = path.join(__dirname, '../deployments', `${network}.json`);
    if (fs.existsSync(deploymentFile)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
      const address = deploymentInfo.contractAddress;
      const updates = await updateConfigurations(network, address);
      
      console.log("\n配置更新结果:");
      updates.forEach(update => console.log(update));
    } else {
      console.error("请提供合约地址或确保部署文件存在");
      console.log("用法: node update-config.js <network> [contractAddress]");
      process.exit(1);
    }
  } else {
    const updates = await updateConfigurations(network, contractAddress);
    
    console.log("\n配置更新结果:");
    updates.forEach(update => console.log(update));
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n🎉 配置更新完成!");
    })
    .catch((error) => {
      console.error("配置更新失败:", error);
      process.exit(1);
    });
}

module.exports = { updateConfigurations };
