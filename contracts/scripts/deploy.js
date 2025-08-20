async function main() {
  const { ethers } = require("hardhat");
  
  console.log("开始部署 HackXCore 智能合约...");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // 部署合约
  const HackXCoreFactory = await ethers.getContractFactory("HackXCore");
  const hackXCore = await HackXCoreFactory.deploy();
  await hackXCore.waitForDeployment();

  const contractAddress = await hackXCore.getAddress();
  console.log("HackXCore 合约已部署到:", contractAddress);

  // 测试基本功能
  console.log("\n开始测试基本功能...");

  // 测试用户注册
  const testUser1 = (await ethers.getSigners())[1];
  const profileCID = "QmTestUserProfileCID123";
  
  console.log("测试用户注册...");
  const registerTx = await hackXCore.connect(testUser1).registerUser(profileCID);
  await registerTx.wait();
  console.log("用户注册成功");

  // 测试获取用户资料
  const userProfile = await hackXCore.getUserProfile(testUser1.address);
  console.log("用户资料CID:", userProfile);

  // 测试创建黑客松
  const hackathonCID = "QmTestHackathonCID456";
  console.log("测试创建黑客松...");
  const createHackathonTx = await hackXCore.connect(testUser1).createHackathon(hackathonCID);
  const receipt = await createHackathonTx.wait();
  console.log("黑客松创建成功");

  // 获取黑客松ID
  const hackathonCount = await hackXCore.getHackathonCount();
  console.log("黑客松总数:", hackathonCount.toString());

  // 测试获取黑客松数据
  const hackathonData = await hackXCore.getHackathonData(1);
  console.log("黑客松数据CID:", hackathonData);

  console.log("\n部署和测试完成！");
  console.log("合约地址:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 