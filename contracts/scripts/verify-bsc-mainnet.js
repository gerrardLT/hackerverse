const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("========================================");
  console.log("BSC主网合约验证脚本");
  console.log("========================================\n");

  // 读取部署信息
  const deploymentFile = path.join(__dirname, '../deployments/bscMainnet.json');
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ 错误：未找到部署信息文件");
    console.log("请先运行部署脚本: npm run deploy:bsc-mainnet");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const contractAddress = deploymentInfo.contractAddress;

  console.log("合约信息:");
  console.log("- 地址:", contractAddress);
  console.log("- 网络:", deploymentInfo.network);
  console.log("- Chain ID:", deploymentInfo.chainId);
  console.log("- 部署时间:", deploymentInfo.timestamp);
  console.log("");

  console.log("开始在BscScan上验证合约...\n");

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
      contract: "contracts/HackXCore.sol:HackXCore"
    });
    
    console.log("\n✅ 合约验证成功!");
    console.log("查看验证结果:", `https://bscscan.com/address/${contractAddress}#code`);
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ 合约已经验证过了");
      console.log("查看合约:", `https://bscscan.com/address/${contractAddress}#code`);
    } else {
      console.error("❌ 验证失败:", error.message);
      console.log("\n手动验证步骤:");
      console.log("1. 访问:", `https://bscscan.com/address/${contractAddress}#code`);
      console.log("2. 点击 'Verify and Publish'");
      console.log("3. 选择:");
      console.log("   - Compiler Type: Solidity (Single file)");
      console.log("   - Compiler Version: v0.8.20+commit.a1b79de6");
      console.log("   - License Type: MIT");
      console.log("4. 复制 contracts/HackXCore.sol 的内容");
      console.log("5. Optimization: Yes (200 runs)");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("验证过程出错:", error);
    process.exit(1);
  });

