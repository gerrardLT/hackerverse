const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HackXCore", function () {
  let hackXCore;
  let owner;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    // 获取测试账户
    [owner, user1, user2, user3] = await ethers.getSigners();

    // 部署合约
    const HackXCoreFactory = await ethers.getContractFactory("HackXCore");
    hackXCore = await HackXCoreFactory.deploy();
    await hackXCore.waitForDeployment();
  });

  describe("用户管理", function () {
    it("应该允许用户注册", async function () {
      const profileCID = "QmTestUserProfileCID";
      
      await expect(hackXCore.connect(user1).registerUser(profileCID))
        .to.emit(hackXCore, "UserRegistered")
        .withArgs(user1.address, profileCID);

      expect(await hackXCore.isUserRegistered(user1.address)).to.be.true;
      expect(await hackXCore.getUserProfile(user1.address)).to.equal(profileCID);
    });

    it("不应该允许重复注册", async function () {
      const profileCID = "QmTestUserProfileCID";
      
      await hackXCore.connect(user1).registerUser(profileCID);
      
      await expect(hackXCore.connect(user1).registerUser(profileCID))
        .to.be.revertedWith("User already registered");
    });

    it("应该允许更新用户资料", async function () {
      const profileCID = "QmTestUserProfileCID";
      const newProfileCID = "QmNewUserProfileCID";
      
      await hackXCore.connect(user1).registerUser(profileCID);
      
      await expect(hackXCore.connect(user1).updateUserProfile(newProfileCID))
        .to.emit(hackXCore, "ProfileUpdated")
        .withArgs(user1.address, newProfileCID);

      expect(await hackXCore.getUserProfile(user1.address)).to.equal(newProfileCID);
    });

    it("未注册用户不能更新资料", async function () {
      const newProfileCID = "QmNewUserProfileCID";
      
      await expect(hackXCore.connect(user1).updateUserProfile(newProfileCID))
        .to.be.revertedWith("User not registered");
    });
  });

  describe("黑客松管理", function () {
    beforeEach(async function () {
      // 注册用户
      await hackXCore.connect(user1).registerUser("QmUser1Profile");
      await hackXCore.connect(user2).registerUser("QmUser2Profile");
    });

    it("应该允许创建黑客松", async function () {
      const hackathonCID = "QmTestHackathonCID";
      
      await expect(hackXCore.connect(user1).createHackathon(hackathonCID))
        .to.emit(hackXCore, "HackathonCreated")
        .withArgs(1, user1.address, hackathonCID);

      expect(await hackXCore.getHackathonData(1)).to.equal(hackathonCID);
      expect(await hackXCore.getHackathonCount()).to.equal(1);
    });

    it("未注册用户不能创建黑客松", async function () {
      const hackathonCID = "QmTestHackathonCID";
      
      await expect(hackXCore.connect(user3).createHackathon(hackathonCID))
        .to.be.revertedWith("User not registered");
    });

    it("应该正确递增黑客松ID", async function () {
      const hackathonCID1 = "QmTestHackathonCID1";
      const hackathonCID2 = "QmTestHackathonCID2";
      
      await hackXCore.connect(user1).createHackathon(hackathonCID1);
      await hackXCore.connect(user2).createHackathon(hackathonCID2);

      expect(await hackXCore.getHackathonCount()).to.equal(2);
      expect(await hackXCore.getHackathonData(1)).to.equal(hackathonCID1);
      expect(await hackXCore.getHackathonData(2)).to.equal(hackathonCID2);
    });
  });

  describe("查询功能", function () {
    beforeEach(async function () {
      await hackXCore.connect(user1).registerUser("QmUser1Profile");
    });

    it("应该正确返回用户资料", async function () {
      const profileCID = "QmTestUserProfileCID";
      await hackXCore.connect(user1).registerUser(profileCID);
      
      const returnedProfile = await hackXCore.getUserProfile(user1.address);
      expect(returnedProfile).to.equal(profileCID);
    });

    it("应该正确返回黑客松数据", async function () {
      const hackathonCID = "QmTestHackathonCID";
      await hackXCore.connect(user1).createHackathon(hackathonCID);
      
      const returnedHackathon = await hackXCore.getHackathonData(1);
      expect(returnedHackathon).to.equal(hackathonCID);
    });

    it("应该正确返回黑客松总数", async function () {
      expect(await hackXCore.getHackathonCount()).to.equal(0);
      
      await hackXCore.connect(user1).createHackathon("QmTestHackathonCID");
      expect(await hackXCore.getHackathonCount()).to.equal(1);
    });
  });
}); 