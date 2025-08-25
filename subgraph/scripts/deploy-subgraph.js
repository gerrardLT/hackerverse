const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function deploySubgraph() {
  console.log("开始部署The Graph子图...");

  // 读取配置
  const network = process.env.DEPLOY_NETWORK || 'polygon';
  const subgraphName = process.env.SUBGRAPH_NAME || `hackx-${network}`;
  const studioKey = process.env.GRAPH_STUDIO_DEPLOY_KEY;
  
  if (!studioKey) {
    throw new Error("请设置 GRAPH_STUDIO_DEPLOY_KEY 环境变量");
  }

  console.log(`部署网络: ${network}`);
  console.log(`子图名称: ${subgraphName}`);

  try {
    // 1. 读取合约部署信息
    const deploymentFile = path.join(__dirname, '../../contracts/deployments', `${network}.json`);
    if (!fs.existsSync(deploymentFile)) {
      throw new Error(`未找到 ${network} 网络的合约部署信息`);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    const contractAddress = deploymentInfo.contractAddress;
    console.log(`合约地址: ${contractAddress}`);

    // 2. 更新subgraph.yaml配置
    console.log("更新子图配置...");
    const subgraphConfigPath = path.join(__dirname, '../subgraph.yaml');
    let subgraphConfig = fs.readFileSync(subgraphConfigPath, 'utf8');
    
    // 更新网络
    subgraphConfig = subgraphConfig.replace(
      /network:\s*\w+/, 
      `network: ${getSubgraphNetwork(network)}`
    );
    
    // 更新合约地址
    subgraphConfig = subgraphConfig.replace(
      /address:\s*["'][^"']*["']/, 
      `address: "${contractAddress}"`
    );
    
    // 更新startBlock（可选，提高同步速度）
    if (deploymentInfo.block) {
      if (subgraphConfig.includes('startBlock:')) {
        subgraphConfig = subgraphConfig.replace(
          /startBlock:\s*\d+/, 
          `startBlock: ${deploymentInfo.block}`
        );
      } else {
        // 在source部分添加startBlock
        subgraphConfig = subgraphConfig.replace(
          /(source:\s*\n.*address:.*\n.*abi:.*)/,
          `$1\n      startBlock: ${deploymentInfo.block}`
        );
      }
    }
    
    fs.writeFileSync(subgraphConfigPath, subgraphConfig);
    console.log("✅ 子图配置已更新");

    // 3. 复制合约ABI
    console.log("复制合约ABI...");
    const abiSourcePath = path.join(__dirname, '../../contracts/artifacts/contracts/HackXCore.sol/HackXCore.json');
    const abiTargetDir = path.join(__dirname, '../abis');
    const abiTargetPath = path.join(abiTargetDir, 'HackXCore.json');
    
    // 创建abis目录
    if (!fs.existsSync(abiTargetDir)) {
      fs.mkdirSync(abiTargetDir, { recursive: true });
    }
    
    // 读取完整的artifact文件，提取ABI
    const artifactContent = JSON.parse(fs.readFileSync(abiSourcePath, 'utf8'));
    const abiContent = {
      abi: artifactContent.abi,
      contractName: artifactContent.contractName,
      sourceName: artifactContent.sourceName
    };
    
    fs.writeFileSync(abiTargetPath, JSON.stringify(abiContent, null, 2));
    console.log("✅ 合约ABI已复制");

    // 4. 生成代码
    console.log("生成子图代码...");
    execSync('graph codegen', { 
      cwd: path.join(__dirname, '..'), 
      stdio: 'inherit' 
    });
    console.log("✅ 代码生成完成");

    // 5. 构建子图
    console.log("构建子图...");
    execSync('graph build', { 
      cwd: path.join(__dirname, '..'), 
      stdio: 'inherit' 
    });
    console.log("✅ 子图构建完成");

    // 6. 部署到Graph Studio
    console.log("部署到Graph Studio...");
    const deployCommand = `graph deploy --studio ${subgraphName}`;
    
    // 设置部署密钥
    process.env.GRAPH_DEPLOY_KEY = studioKey;
    
    execSync(deployCommand, { 
      cwd: path.join(__dirname, '..'), 
      stdio: 'inherit',
      env: { ...process.env, GRAPH_DEPLOY_KEY: studioKey }
    });
    
    console.log("✅ 子图部署完成");

    // 7. 保存部署信息
    const subgraphDeploymentInfo = {
      network: network,
      subgraphName: subgraphName,
      contractAddress: contractAddress,
      startBlock: deploymentInfo.block,
      deployedAt: new Date().toISOString(),
      studioUrl: `https://thegraph.com/studio/subgraph/${subgraphName}`,
      queryUrl: `https://api.studio.thegraph.com/query/${subgraphName}/v1`
    };

    const subgraphDeploymentFile = path.join(__dirname, '../deployments', `${network}.json`);
    
    // 创建deployments目录
    const subgraphDeploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(subgraphDeploymentsDir)) {
      fs.mkdirSync(subgraphDeploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(subgraphDeploymentFile, JSON.stringify(subgraphDeploymentInfo, null, 2));
    console.log("✅ 子图部署信息已保存");

    return subgraphDeploymentInfo;

  } catch (error) {
    console.error("❌ 子图部署失败:", error.message);
    throw error;
  }
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

async function main() {
  try {
    const deploymentInfo = await deploySubgraph();
    
    console.log("\n🎉 子图部署成功!");
    console.log("部署信息:", deploymentInfo);
    console.log("\n接下来的步骤:");
    console.log("1. 等待子图同步完成");
    console.log("2. 在Graph Studio中验证查询功能");
    console.log("3. 更新前端配置中的子图URL");
    console.log(`4. 访问: ${deploymentInfo.studioUrl}`);
    
  } catch (error) {
    console.error("部署失败:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { deploySubgraph };
