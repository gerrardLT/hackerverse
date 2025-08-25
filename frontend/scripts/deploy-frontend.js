const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function deployFrontend() {
  console.log("开始部署前端到生产环境...");

  const network = process.env.DEPLOY_NETWORK || 'polygon';
  const vercelToken = process.env.VERCEL_TOKEN;
  
  try {
    // 1. 读取合约部署信息
    console.log("读取合约部署信息...");
    const contractDeploymentFile = path.join(__dirname, '../../contracts/deployments', `${network}.json`);
    if (!fs.existsSync(contractDeploymentFile)) {
      throw new Error(`未找到 ${network} 网络的合约部署信息`);
    }
    const contractInfo = JSON.parse(fs.readFileSync(contractDeploymentFile, 'utf8'));

    // 2. 读取子图部署信息
    console.log("读取子图部署信息...");
    const subgraphDeploymentFile = path.join(__dirname, '../../subgraph/deployments', `${network}.json`);
    let subgraphInfo = null;
    if (fs.existsSync(subgraphDeploymentFile)) {
      subgraphInfo = JSON.parse(fs.readFileSync(subgraphDeploymentFile, 'utf8'));
    }

    // 3. 创建生产环境配置
    console.log("创建生产环境配置...");
    const productionEnv = createProductionConfig(network, contractInfo, subgraphInfo);
    
    const envProductionPath = path.join(__dirname, '../.env.production');
    fs.writeFileSync(envProductionPath, productionEnv);
    console.log("✅ 生产环境配置已创建");

    // 4. 更新智能合约配置文件
    console.log("更新智能合约配置...");
    updateSmartContractConfig(network, contractInfo.contractAddress);

    // 5. 构建前端项目
    console.log("构建前端项目...");
    execSync('npm run build', { 
      cwd: path.join(__dirname, '..'), 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    console.log("✅ 前端构建完成");

    // 6. 部署到Vercel（如果配置了Vercel）
    if (vercelToken) {
      console.log("部署到Vercel...");
      
      // 创建vercel.json配置
      const vercelConfig = createVercelConfig();
      const vercelConfigPath = path.join(__dirname, '../vercel.json');
      fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
      
      // 设置环境变量
      const envVars = createVercelEnvVars(network, contractInfo, subgraphInfo);
      
      try {
        // 部署到Vercel
        execSync('vercel --prod --yes', {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit',
          env: { ...process.env, VERCEL_TOKEN: vercelToken, ...envVars }
        });
        console.log("✅ Vercel部署完成");
      } catch (error) {
        console.warn("Vercel部署失败，继续其他步骤:", error.message);
      }
    }

    // 7. 保存部署信息
    const frontendDeploymentInfo = {
      network: network,
      contractAddress: contractInfo.contractAddress,
      subgraphUrl: subgraphInfo ? subgraphInfo.queryUrl : null,
      buildTime: new Date().toISOString(),
      environment: 'production',
      vercelDeployed: !!vercelToken
    };

    const frontendDeploymentFile = path.join(__dirname, '../deployments', `${network}.json`);
    
    // 创建deployments目录
    const frontendDeploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(frontendDeploymentsDir)) {
      fs.mkdirSync(frontendDeploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(frontendDeploymentFile, JSON.stringify(frontendDeploymentInfo, null, 2));
    console.log("✅ 前端部署信息已保存");

    return frontendDeploymentInfo;

  } catch (error) {
    console.error("❌ 前端部署失败:", error.message);
    throw error;
  }
}

function createProductionConfig(network, contractInfo, subgraphInfo) {
  const chainId = getChainId(network);
  const rpcUrl = getRpcUrl(network);
  
  return `# HackX前端生产环境配置
# 生成时间: ${new Date().toISOString()}

# 区块链配置
NEXT_PUBLIC_CHAIN_ID=${chainId}
NEXT_PUBLIC_NETWORK_NAME=${network}
NEXT_PUBLIC_RPC_URL=${rpcUrl}

# 智能合约配置
NEXT_PUBLIC_HACKX_CORE_ADDRESS=${contractInfo.contractAddress}

# The Graph配置
${subgraphInfo ? `NEXT_PUBLIC_SUBGRAPH_URL=${subgraphInfo.queryUrl}` : '# NEXT_PUBLIC_SUBGRAPH_URL=待配置'}

# IPFS配置
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
NEXT_PUBLIC_PINATA_GATEWAY=请配置您的Pinata专用网关域名

# 应用配置
NEXT_PUBLIC_APP_NAME=HackX
NEXT_PUBLIC_APP_DESCRIPTION=去中心化黑客松平台
NEXT_PUBLIC_APP_URL=https://hackx.vercel.app

# 分析和监控
NEXT_PUBLIC_ANALYTICS_ID=请配置分析ID
NEXT_PUBLIC_SENTRY_DSN=请配置Sentry DSN

# Web3 Provider配置
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=请配置WalletConnect项目ID
NEXT_PUBLIC_ALCHEMY_API_KEY=请配置Alchemy API Key

# 功能开关
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_SENTRY=true
NEXT_PUBLIC_ENABLE_WEB3_ONBOARD=true
`;
}

function updateSmartContractConfig(network, contractAddress) {
  const configPath = path.join(__dirname, '../lib/smart-contracts.ts');
  
  if (!fs.existsSync(configPath)) {
    // 创建新的配置文件
    const configContent = createSmartContractConfig(network, contractAddress);
    fs.writeFileSync(configPath, configContent);
  } else {
    // 更新现有配置文件
    let config = fs.readFileSync(configPath, 'utf8');
    const chainId = getChainId(network);
    
    // 更新合约地址配置
    const addressRegex = /export const HACKX_CORE_ADDRESS[^}]*}/s;
    const newAddressConfig = `export const HACKX_CORE_ADDRESS: { [key: number]: string } = {
  ${chainId}: '${contractAddress}'
}`;
    
    if (addressRegex.test(config)) {
      config = config.replace(addressRegex, newAddressConfig);
    } else {
      config += '\n\n' + newAddressConfig + '\n';
    }
    
    fs.writeFileSync(configPath, config);
  }
  
  console.log("✅ 智能合约配置已更新");
}

function createSmartContractConfig(network, contractAddress) {
  const chainId = getChainId(network);
  
  return `// HackX智能合约配置
// 自动生成于: ${new Date().toISOString()}

export const HACKX_CORE_ADDRESS: { [key: number]: string } = {
  ${chainId}: '${contractAddress}'
};

export const CHAIN_CONFIG = {
  ${chainId}: {
    name: '${network}',
    rpcUrl: '${getRpcUrl(network)}',
    blockExplorer: '${getBlockExplorer(network)}'
  }
};

export const ABI_HACKX_CORE = [
  // ABI将在构建时从artifacts自动导入
  // 如需手动更新，请参考 contracts/artifacts/contracts/HackXCore.sol/HackXCore.json
];

// 获取当前网络的合约地址
export function getContractAddress(chainId: number): string {
  const address = HACKX_CORE_ADDRESS[chainId];
  if (!address) {
    throw new Error(\`不支持的链ID: \${chainId}\`);
  }
  return address;
}

// 获取当前网络配置
export function getChainConfig(chainId: number) {
  const config = CHAIN_CONFIG[chainId];
  if (!config) {
    throw new Error(\`不支持的链ID: \${chainId}\`);
  }
  return config;
}
`;
}

function createVercelConfig() {
  return {
    "framework": "nextjs",
    "buildCommand": "npm run build",
    "outputDirectory": ".next",
    "installCommand": "npm install",
    "devCommand": "npm run dev",
    "env": {
      "NODE_ENV": "production"
    },
    "build": {
      "env": {
        "NODE_ENV": "production"
      }
    },
    "functions": {
      "app/api/**": {
        "maxDuration": 30
      }
    },
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "/api/:path*",
        "destination": "/api/:path*"
      }
    ]
  };
}

function createVercelEnvVars(network, contractInfo, subgraphInfo) {
  const chainId = getChainId(network);
  
  return {
    NEXT_PUBLIC_CHAIN_ID: chainId.toString(),
    NEXT_PUBLIC_NETWORK_NAME: network,
    NEXT_PUBLIC_HACKX_CORE_ADDRESS: contractInfo.contractAddress,
    NEXT_PUBLIC_SUBGRAPH_URL: subgraphInfo ? subgraphInfo.queryUrl : '',
    NEXT_PUBLIC_RPC_URL: getRpcUrl(network)
  };
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

function getBlockExplorer(network) {
  const explorers = {
    mainnet: 'https://etherscan.io',
    polygon: 'https://polygonscan.com',
    arbitrumOne: 'https://arbiscan.io',
    optimism: 'https://optimistic.etherscan.io',
    sepolia: 'https://sepolia.etherscan.io',
    polygonMumbai: 'https://mumbai.polygonscan.com'
  };
  return explorers[network] || 'https://etherscan.io';
}

async function main() {
  try {
    const deploymentInfo = await deployFrontend();
    
    console.log("\n🎉 前端部署成功!");
    console.log("部署信息:", deploymentInfo);
    console.log("\n接下来的步骤:");
    console.log("1. 配置域名和SSL证书");
    console.log("2. 设置环境变量（API密钥等）");
    console.log("3. 测试生产环境功能");
    console.log("4. 监控应用性能和错误");
    
  } catch (error) {
    console.error("前端部署失败:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { deployFrontend };
