const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  // 读取部署信息
  const network = hre.network.name;
  const deploymentFile = path.join(__dirname, '../deployments', `${network}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`未找到 ${network} 网络的部署信息: ${deploymentFile}`);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const contractAddress = deploymentInfo.contractAddress;

  console.log(`开始验证 ${network} 网络上的HackXCore合约...`);
  console.log("合约地址:", contractAddress);

  try {
    // 验证合约
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // HackXCore构造函数没有参数
    });

    console.log("✅ 合约验证成功!");
    
    // 更新部署信息
    deploymentInfo.verified = true;
    deploymentInfo.verifiedAt = new Date().toISOString();
    
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("✅ 部署信息已更新");

  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ 合约已经验证过了");
    } else {
      console.error("❌ 合约验证失败:", error.message);
      throw error;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
