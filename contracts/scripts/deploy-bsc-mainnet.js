const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("========================================");
  console.log("开始部署HackXCore合约到BSC主网");
  console.log("========================================\n");

  // 获取网络信息
  const network = hre.network.name;
  const chainId = hre.network.config.chainId;
  
  console.log("网络信息:");
  console.log("- 网络名称:", network);
  console.log("- Chain ID:", chainId);
  
  if (chainId !== 56) {
    throw new Error(`❌ 错误：当前网络不是BSC主网 (Chain ID: ${chainId})，请使用 --network bscMainnet`);
  }

  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n部署账户信息:");
  console.log("- 地址:", deployer.address);

  // 检查账户余额
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceInBNB = hre.ethers.formatEther(balance);
  console.log("- 余额:", balanceInBNB, "BNB");

  // 检查余额是否充足（建议至少0.1 BNB）
  if (parseFloat(balanceInBNB) < 0.05) {
    console.log("\n⚠️  警告：账户余额较低，建议至少0.1 BNB以确保部署成功");
    console.log("是否继续部署？(程序将在5秒后自动继续)\n");
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // 获取当前Gas价格
  const feeData = await hre.ethers.provider.getFeeData();
  console.log("\n当前Gas信息:");
  console.log("- Gas价格:", hre.ethers.formatUnits(feeData.gasPrice, "gwei"), "Gwei");

  // 部署HackXCore合约
  console.log("\n========================================");
  console.log("正在部署HackXCore合约...");
  console.log("========================================\n");
  
  const HackXCore = await hre.ethers.getContractFactory("HackXCore");
  
  // 估算部署费用
  const deploymentData = HackXCore.interface.encodeDeploy([]);
  const estimatedGas = await hre.ethers.provider.estimateGas({
    data: deploymentData,
  });
  const estimatedCost = estimatedGas * feeData.gasPrice;
  console.log("预估部署费用:");
  console.log("- Gas数量:", estimatedGas.toString());
  console.log("- 费用:", hre.ethers.formatEther(estimatedCost), "BNB");

  // 部署合约
  console.log("\n开始部署...");
  const hackXCore = await HackXCore.deploy();
  
  console.log("等待部署交易确认...");
  await hackXCore.waitForDeployment();

  const contractAddress = await hackXCore.getAddress();
  console.log("\n✅ HackXCore合约部署成功!");
  console.log("合约地址:", contractAddress);

  // 验证部署
  console.log("\n验证合约部署...");
  const code = await hre.ethers.provider.getCode(contractAddress);
  if (code === '0x') {
    throw new Error("❌ 合约部署失败 - 未找到合约代码");
  }
  console.log("✅ 合约代码验证成功");

  // 获取部署交易信息
  const deployTx = hackXCore.deploymentTransaction();
  let txInfo = {};
  
  if (deployTx) {
    const receipt = await deployTx.wait();
    txInfo = {
      hash: deployTx.hash,
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: deployTx.gasPrice ? deployTx.gasPrice.toString() : "N/A",
      actualCost: hre.ethers.formatEther(receipt.gasUsed * deployTx.gasPrice)
    };
    
    console.log("\n部署交易信息:");
    console.log("- 交易哈希:", txInfo.hash);
    console.log("- Gas使用量:", txInfo.gasUsed);
    console.log("- 实际费用:", txInfo.actualCost, "BNB");
    console.log("- BscScan链接:", `https://bscscan.com/tx/${txInfo.hash}`);
  }

  // 保存部署信息
  const deploymentInfo = {
    network: network,
    chainId: chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTx: txInfo.hash || null,
    gasUsed: txInfo.gasUsed || null,
    actualCost: txInfo.actualCost || null,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    bscscanUrl: `https://bscscan.com/address/${contractAddress}`
  };

  // 创建deployments目录
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // 保存部署信息到文件
  const deploymentFile = path.join(deploymentsDir, 'bscMainnet.json');
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n✅ 部署信息已保存到:", deploymentFile);

  // 测试合约基本功能
  console.log("\n========================================");
  console.log("测试合约基本功能");
  console.log("========================================\n");

  try {
    // 测试注册用户
    console.log("测试用户注册功能...");
    const testProfileCID = "QmTestUserProfile123456789";
    const registerTx = await hackXCore.registerUser(testProfileCID);
    await registerTx.wait();
    console.log("✅ 用户注册功能正常");

    // 验证用户资料
    const userProfile = await hackXCore.getUserProfile(deployer.address);
    console.log("✅ 获取用户资料:", userProfile);

    // 测试创建黑客松
    console.log("\n测试创建黑客松功能...");
    const testHackathonCID = "QmTestHackathon123456789";
    const createTx = await hackXCore.createHackathon(testHackathonCID);
    await createTx.wait();
    console.log("✅ 创建黑客松功能正常");

    // 获取黑客松数量
    const hackathonCount = await hackXCore.getHackathonCount();
    console.log("✅ 黑客松总数:", hackathonCount.toString());

  } catch (error) {
    console.log("⚠️  基本功能测试失败:", error.message);
    console.log("这可能不影响合约部署，请手动验证");
  }

  // 合约验证提示
  console.log("\n========================================");
  console.log("后续步骤");
  console.log("========================================\n");
  
  console.log("1. 在BscScan上验证合约:");
  console.log("   - 访问:", `https://bscscan.com/address/${contractAddress}#code`);
  console.log("   - 或使用命令: npm run verify:bsc -- --network bscMainnet", contractAddress);
  console.log("");
  
  console.log("2. 更新前端配置文件:");
  console.log("   - frontend/.env.local:");
  console.log("     NEXT_PUBLIC_CONTRACT_ADDRESS=" + contractAddress);
  console.log("     NEXT_PUBLIC_CHAIN_ID=56");
  console.log("     NEXT_PUBLIC_NETWORK_NAME=bsc-mainnet");
  console.log("");
  
  console.log("3. 更新后端配置文件:");
  console.log("   - backend/.env:");
  console.log("     CONTRACT_ADDRESS=" + contractAddress);
  console.log("     CHAIN_ID=56");
  console.log("     BSC_RPC_URL=https://bsc-dataseed1.bnbchain.org");
  console.log("");
  
  console.log("4. 更新子图配置（如果使用）:");
  console.log("   - subgraph/subgraph.yaml 中的合约地址");
  console.log("");

  console.log("5. 重新部署前端和后端");
  console.log("");

  console.log("✅ 部署完成!");
  console.log("合约地址:", contractAddress);
  console.log("BscScan:", `https://bscscan.com/address/${contractAddress}`);
  
  return {
    contractAddress,
    deploymentInfo
  };
}

// 处理错误
main()
  .then((result) => {
    console.log("\n🎉 部署成功!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 部署失败:", error);
    process.exit(1);
  });

