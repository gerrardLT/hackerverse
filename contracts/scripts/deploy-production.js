const hre = require("hardhat");

async function main() {
  console.log("开始部署HackXCore合约到生产环境...");

  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署账户:", deployer.address);

  // 检查账户余额
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("账户余额:", hre.ethers.formatEther(balance), "ETH");

  // 部署HackXCore合约
  console.log("\n正在部署HackXCore合约...");
  const HackXCore = await hre.ethers.getContractFactory("HackXCore");
  
  // 估算Gas费用
  const deploymentData = HackXCore.interface.encodeDeploy([]);
  const estimatedGas = await hre.ethers.provider.estimateGas({
    data: deploymentData,
  });
  console.log("预估Gas费用:", estimatedGas.toString());

  // 部署合约
  const hackXCore = await HackXCore.deploy();
  
  console.log("等待合约部署确认...");
  await hackXCore.waitForDeployment();

  const contractAddress = await hackXCore.getAddress();
  console.log("✅ HackXCore合约部署成功!");
  console.log("合约地址:", contractAddress);

  // 验证部署
  console.log("\n验证合约部署...");
  const code = await hre.ethers.provider.getCode(contractAddress);
  if (code === '0x') {
    throw new Error("合约部署失败 - 未找到合约代码");
  }
  console.log("✅ 合约部署验证成功");

  // 获取部署交易信息
  const deployTx = hackXCore.deploymentTransaction();
  if (deployTx) {
    console.log("\n部署交易信息:");
    console.log("交易哈希:", deployTx.hash);
    console.log("Gas费用:", deployTx.gasLimit.toString());
    console.log("Gas价格:", deployTx.gasPrice ? deployTx.gasPrice.toString() : "N/A");
  }

  // 保存部署信息
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTx: deployTx ? deployTx.hash : null,
    timestamp: new Date().toISOString(),
    block: await hre.ethers.provider.getBlockNumber()
  };

  const fs = require('fs');
  const path = require('path');
  
  // 创建deployments目录
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // 保存部署信息到文件
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ 部署信息已保存到:", deploymentFile);

  // 如果启用了合约验证，进行验证
  if (process.env.CONTRACT_VERIFICATION === 'true') {
    console.log("\n开始合约验证...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ 合约验证成功");
    } catch (error) {
      console.error("❌ 合约验证失败:", error.message);
    }
  }

  console.log("\n🎉 部署完成!");
  console.log("请更新前端和子图配置文件中的合约地址:", contractAddress);
  
  return {
    contractAddress,
    deploymentInfo
  };
}

// 处理错误
main()
  .then((result) => {
    console.log("\n部署结果:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });
