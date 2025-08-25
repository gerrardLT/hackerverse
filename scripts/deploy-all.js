const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 导入各模块的部署脚本
const contractsDeployPath = path.join(__dirname, '../contracts/scripts/deploy-production.js');
const subgraphDeployPath = path.join(__dirname, '../subgraph/scripts/deploy-subgraph.js');
const frontendDeployPath = path.join(__dirname, '../frontend/scripts/deploy-frontend.js');

async function deployAll() {
  console.log("🚀 开始HackX项目完整部署流程...");
  console.log("==================================================");

  const network = process.env.DEPLOY_NETWORK || 'polygon';
  const skipSteps = (process.env.SKIP_STEPS || '').split(',').filter(s => s.trim());
  
  console.log(`目标网络: ${network}`);
  console.log(`跳过步骤: ${skipSteps.length ? skipSteps.join(', ') : '无'}`);
  console.log("==================================================\n");

  const deploymentResults = {
    network: network,
    startTime: new Date().toISOString(),
    steps: {}
  };

  try {
    // 第一步：部署智能合约
    if (!skipSteps.includes('contracts')) {
      console.log("📋 步骤 1/4: 部署智能合约");
      console.log("--------------------------------------------------");
      
      try {
        execSync(`npm run deploy:production`, {
          cwd: path.join(__dirname, '../contracts'),
          stdio: 'inherit',
          env: { ...process.env, DEPLOY_NETWORK: network }
        });
        
        deploymentResults.steps.contracts = {
          status: 'success',
          completedAt: new Date().toISOString()
        };
        console.log("✅ 智能合约部署完成\n");
      } catch (error) {
        deploymentResults.steps.contracts = {
          status: 'failed',
          error: error.message,
          failedAt: new Date().toISOString()
        };
        throw new Error(`智能合约部署失败: ${error.message}`);
      }
    } else {
      console.log("⏭️  跳过智能合约部署\n");
      deploymentResults.steps.contracts = { status: 'skipped' };
    }

    // 第二步：验证智能合约
    if (!skipSteps.includes('verify')) {
      console.log("📋 步骤 2/4: 验证智能合约");
      console.log("--------------------------------------------------");
      
      try {
        execSync(`node scripts/verify-contract.js`, {
          cwd: path.join(__dirname, '../contracts'),
          stdio: 'inherit',
          env: { ...process.env, DEPLOY_NETWORK: network }
        });
        
        deploymentResults.steps.verify = {
          status: 'success',
          completedAt: new Date().toISOString()
        };
        console.log("✅ 智能合约验证完成\n");
      } catch (error) {
        deploymentResults.steps.verify = {
          status: 'failed',
          error: error.message,
          failedAt: new Date().toISOString()
        };
        console.warn(`⚠️  智能合约验证失败: ${error.message}`);
        console.log("继续部署流程...\n");
      }
    } else {
      console.log("⏭️  跳过智能合约验证\n");
      deploymentResults.steps.verify = { status: 'skipped' };
    }

    // 第三步：部署The Graph子图
    if (!skipSteps.includes('subgraph')) {
      console.log("📋 步骤 3/4: 部署The Graph子图");
      console.log("--------------------------------------------------");
      
      try {
        execSync(`node scripts/deploy-subgraph.js`, {
          cwd: path.join(__dirname, '../subgraph'),
          stdio: 'inherit',
          env: { ...process.env, DEPLOY_NETWORK: network }
        });
        
        deploymentResults.steps.subgraph = {
          status: 'success',
          completedAt: new Date().toISOString()
        };
        console.log("✅ The Graph子图部署完成\n");
      } catch (error) {
        deploymentResults.steps.subgraph = {
          status: 'failed',
          error: error.message,
          failedAt: new Date().toISOString()
        };
        console.warn(`⚠️  子图部署失败: ${error.message}`);
        console.log("继续部署流程...\n");
      }
    } else {
      console.log("⏭️  跳过The Graph子图部署\n");
      deploymentResults.steps.subgraph = { status: 'skipped' };
    }

    // 第四步：部署前端
    if (!skipSteps.includes('frontend')) {
      console.log("📋 步骤 4/4: 部署前端应用");
      console.log("--------------------------------------------------");
      
      try {
        execSync(`node scripts/deploy-frontend.js`, {
          cwd: path.join(__dirname, '../frontend'),
          stdio: 'inherit',
          env: { ...process.env, DEPLOY_NETWORK: network }
        });
        
        deploymentResults.steps.frontend = {
          status: 'success',
          completedAt: new Date().toISOString()
        };
        console.log("✅ 前端应用部署完成\n");
      } catch (error) {
        deploymentResults.steps.frontend = {
          status: 'failed',
          error: error.message,
          failedAt: new Date().toISOString()
        };
        throw new Error(`前端部署失败: ${error.message}`);
      }
    } else {
      console.log("⏭️  跳过前端应用部署\n");
      deploymentResults.steps.frontend = { status: 'skipped' };
    }

    // 保存部署结果
    deploymentResults.endTime = new Date().toISOString();
    deploymentResults.status = 'success';
    
    const resultFile = path.join(__dirname, '../deployments', `${network}-full-deployment.json`);
    
    // 创建根目录deployments文件夹
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(resultFile, JSON.stringify(deploymentResults, null, 2));

    // 显示部署总结
    console.log("==================================================");
    console.log("🎉 HackX项目部署完成!");
    console.log("==================================================");
    
    console.log("📊 部署总结:");
    Object.entries(deploymentResults.steps).forEach(([step, result]) => {
      const status = result.status === 'success' ? '✅' : 
                     result.status === 'failed' ? '❌' : 
                     result.status === 'skipped' ? '⏭️' : '❓';
      console.log(`  ${status} ${step}: ${result.status}`);
    });

    console.log(`\n📁 部署详情已保存到: ${resultFile}`);
    
    // 读取各模块的部署信息
    const contractInfo = readDeploymentInfo('contracts', network);
    const subgraphInfo = readDeploymentInfo('subgraph', network);
    const frontendInfo = readDeploymentInfo('frontend', network);

    console.log("\n🔗 部署地址:");
    if (contractInfo) {
      console.log(`  智能合约: ${contractInfo.contractAddress}`);
      console.log(`  区块浏览器: ${getBlockExplorerUrl(network, contractInfo.contractAddress)}`);
    }
    if (subgraphInfo) {
      console.log(`  The Graph: ${subgraphInfo.studioUrl}`);
      console.log(`  GraphQL端点: ${subgraphInfo.queryUrl}`);
    }
    if (frontendInfo && process.env.VERCEL_TOKEN) {
      console.log(`  前端应用: 请查看Vercel部署日志`);
    }

    console.log("\n📝 后续任务:");
    console.log("  1. 等待子图完全同步（约10-30分钟）");
    console.log("  2. 测试所有功能是否正常工作");
    console.log("  3. 配置监控和警报");
    console.log("  4. 更新文档中的地址信息");
    console.log("  5. 通知团队部署完成");

    return deploymentResults;

  } catch (error) {
    deploymentResults.endTime = new Date().toISOString();
    deploymentResults.status = 'failed';
    deploymentResults.error = error.message;
    
    console.error("\n❌ 部署失败:", error.message);
    console.log("\n🔧 故障排除:");
    console.log("  1. 检查网络连接和RPC节点状态");
    console.log("  2. 确认账户余额足够支付Gas费用");
    console.log("  3. 验证所有环境变量设置正确");
    console.log("  4. 查看具体错误日志进行调试");
    
    throw error;
  }
}

function readDeploymentInfo(module, network) {
  const filePath = path.join(__dirname, `../${module}/deployments`, `${network}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

function getBlockExplorerUrl(network, address) {
  const explorers = {
    mainnet: 'https://etherscan.io/address/',
    polygon: 'https://polygonscan.com/address/',
    arbitrumOne: 'https://arbiscan.io/address/',
    optimism: 'https://optimistic.etherscan.io/address/',
    sepolia: 'https://sepolia.etherscan.io/address/',
    polygonMumbai: 'https://mumbai.polygonscan.com/address/'
  };
  return (explorers[network] || 'https://etherscan.io/address/') + address;
}

// 处理命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      options[key] = value;
      if (value !== true) i++; // 跳过值参数
    }
  }
  
  return options;
}

async function main() {
  const options = parseArgs();
  
  // 设置环境变量
  if (options.network) process.env.DEPLOY_NETWORK = options.network;
  if (options.skip) process.env.SKIP_STEPS = options.skip;
  
  console.log("HackX去中心化平台部署工具");
  console.log("用法: node deploy-all.js [选项]");
  console.log("选项:");
  console.log("  --network <network>  目标网络 (默认: polygon)");
  console.log("  --skip <steps>       跳过的步骤，逗号分隔 (contracts,verify,subgraph,frontend)");
  console.log("  --help              显示帮助信息");
  console.log("");
  
  if (options.help) {
    return;
  }
  
  try {
    await deployAll();
  } catch (error) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { deployAll };
