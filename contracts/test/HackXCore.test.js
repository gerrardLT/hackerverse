const { expect } = require("chai");
const hre = require("hardhat");

describe("HackXCore", function () {
  let hackXCore;
  let owner;
  let user1;
  let user2;
  let user3;
  let judge1;

  beforeEach(async function () {
    // 获取测试账户
    [owner, user1, user2, user3, judge1] = await hre.ethers.getSigners();

    // 部署合约
    const HackXCoreFactory = await hre.ethers.getContractFactory("HackXCore");
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

    it("不应该允许空CID注册", async function () {
      await expect(hackXCore.connect(user1).registerUser(""))
        .to.be.revertedWith("Profile CID cannot be empty");
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

    it("不应该允许空CID更新", async function () {
      await hackXCore.connect(user1).registerUser("QmTestUserProfileCID");
      
      await expect(hackXCore.connect(user1).updateUserProfile(""))
        .to.be.revertedWith("Profile CID cannot be empty");
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
      expect(await hackXCore.getHackathonCount()).to.equal(1n);
    });

    it("未注册用户不能创建黑客松", async function () {
      const hackathonCID = "QmTestHackathonCID";
      
      await expect(hackXCore.connect(user3).createHackathon(hackathonCID))
        .to.be.revertedWith("User not registered");
    });

    it("不应该允许空CID创建黑客松", async function () {
      await expect(hackXCore.connect(user1).createHackathon(""))
        .to.be.revertedWith("Hackathon data CID cannot be empty");
    });

    it("应该正确递增黑客松ID", async function () {
      const hackathonCID1 = "QmTestHackathonCID1";
      const hackathonCID2 = "QmTestHackathonCID2";
      
      await hackXCore.connect(user1).createHackathon(hackathonCID1);
      await hackXCore.connect(user2).createHackathon(hackathonCID2);

      expect(await hackXCore.getHackathonCount()).to.equal(2n);
      expect(await hackXCore.getHackathonData(1)).to.equal(hackathonCID1);
      expect(await hackXCore.getHackathonData(2)).to.equal(hackathonCID2);
    });

    it("应该允许更新黑客松数据", async function () {
      const hackathonCID = "QmTestHackathonCID";
      const newHackathonCID = "QmNewHackathonCID";
      
      await hackXCore.connect(user1).createHackathon(hackathonCID);
      
      await expect(hackXCore.connect(user1).updateHackathon(1, newHackathonCID))
        .to.emit(hackXCore, "HackathonUpdated")
        .withArgs(1, newHackathonCID);

      expect(await hackXCore.getHackathonData(1)).to.equal(newHackathonCID);
    });

    it("非组织者不能更新黑客松", async function () {
      const hackathonCID = "QmTestHackathonCID";
      const newHackathonCID = "QmNewHackathonCID";
      
      await hackXCore.connect(user1).createHackathon(hackathonCID);
      
      await expect(hackXCore.connect(user2).updateHackathon(1, newHackathonCID))
        .to.be.revertedWith("Not hackathon organizer");
    });

    it("不能更新不存在的黑客松", async function () {
      const newHackathonCID = "QmNewHackathonCID";
      
      // 先注册用户3，然后尝试更新不存在的黑客松
      await hackXCore.connect(user3).registerUser("QmUser3Profile");
      await expect(hackXCore.connect(user3).updateHackathon(999, newHackathonCID))
        .to.be.revertedWith("Hackathon does not exist");
    });
  });

  describe("参与者管理", function () {
    beforeEach(async function () {
      await hackXCore.connect(user1).registerUser("QmUser1Profile");
      await hackXCore.connect(user2).registerUser("QmUser2Profile");
      await hackXCore.connect(user1).createHackathon("QmTestHackathonCID");
    });

    it("应该允许用户加入黑客松", async function () {
      await expect(hackXCore.connect(user2).joinHackathon(1))
        .to.emit(hackXCore, "UserJoinedHackathon")
        .withArgs(1, user2.address);

      const participants = await hackXCore.getHackathonParticipants(1);
      expect(participants).to.include(user2.address);
    });

    it("不能重复加入同一个黑客松", async function () {
      await hackXCore.connect(user2).joinHackathon(1);
      
      await expect(hackXCore.connect(user2).joinHackathon(1))
        .to.be.revertedWith("Already participating");
    });

    it("应该允许用户退出黑客松", async function () {
      await hackXCore.connect(user2).joinHackathon(1);
      
      await expect(hackXCore.connect(user2).leaveHackathon(1))
        .to.emit(hackXCore, "UserLeftHackathon")
        .withArgs(1, user2.address);

      const participants = await hackXCore.getHackathonParticipants(1);
      expect(participants).to.not.include(user2.address);
    });

    it("不能退出未参与的黑客松", async function () {
      await expect(hackXCore.connect(user2).leaveHackathon(1))
        .to.be.revertedWith("Not participating in this hackathon");
    });

    it("应该正确跟踪用户参与的黑客松", async function () {
      await hackXCore.connect(user2).joinHackathon(1);
      
      const userHackathons = await hackXCore.getUserHackathons(user2.address);
      expect(userHackathons).to.include(1n);
    });
  });

  describe("项目提交", function () {
    beforeEach(async function () {
      await hackXCore.connect(user1).registerUser("QmUser1Profile");
      await hackXCore.connect(user2).registerUser("QmUser2Profile");
      await hackXCore.connect(user1).createHackathon("QmTestHackathonCID");
      await hackXCore.connect(user2).joinHackathon(1);
    });

    it("应该允许参与者提交项目", async function () {
      const projectCID = "QmTestProjectCID";
      
      await expect(hackXCore.connect(user2).submitProject(1, projectCID))
        .to.emit(hackXCore, "ProjectSubmitted")
        .withArgs(1, user2.address, projectCID);

      const submission = await hackXCore.getProjectSubmission(1, user2.address);
      expect(submission).to.equal(projectCID);
    });

    it("不应该允许空CID提交项目", async function () {
      await expect(hackXCore.connect(user2).submitProject(1, ""))
        .to.be.revertedWith("Project CID cannot be empty");
    });

    it("非参与者不能提交项目", async function () {
      const projectCID = "QmTestProjectCID";
      
      await expect(hackXCore.connect(user3).submitProject(1, projectCID))
        .to.be.revertedWith("User not registered");
    });
  });

  describe("评分系统", function () {
    beforeEach(async function () {
      await hackXCore.connect(user1).registerUser("QmUser1Profile");
      await hackXCore.connect(judge1).registerUser("QmJudge1Profile");
      await hackXCore.connect(user1).createHackathon("QmTestHackathonCID");
      await hackXCore.connect(user2).registerUser("QmUser2Profile");
      await hackXCore.connect(user2).joinHackathon(1);
      await hackXCore.connect(user2).submitProject(1, "QmTestProjectCID");
    });

    it("应该允许提交评分", async function () {
      const score = 85;
      
      await expect(hackXCore.connect(judge1).submitScore(1, judge1.address, score))
        .to.emit(hackXCore, "ScoreSubmitted")
        .withArgs(1, judge1.address, score);

      const submittedScore = await hackXCore.getProjectScore(1, judge1.address);
      expect(submittedScore).to.equal(score);
    });

    it("评分应该在有效范围内", async function () {
      await expect(hackXCore.connect(judge1).submitScore(1, judge1.address, 101))
        .to.be.revertedWith("Score must be between 0 and 100");
    });

    it("未注册用户不能提交评分", async function () {
      await expect(hackXCore.connect(user3).submitScore(1, judge1.address, 85))
        .to.be.revertedWith("User not registered");
    });
  });

  describe("查询功能", function () {
    it("应该正确返回用户资料", async function () {
      const profileCID = "QmTestUserProfileCID";
      await hackXCore.connect(user1).registerUser(profileCID);
      
      const returnedProfile = await hackXCore.getUserProfile(user1.address);
      expect(returnedProfile).to.equal(profileCID);
    });

    it("应该正确返回黑客松数据", async function () {
      await hackXCore.connect(user1).registerUser("QmUser1Profile");
      const hackathonCID = "QmTestHackathonCID";
      await hackXCore.connect(user1).createHackathon(hackathonCID);
      
      const returnedHackathon = await hackXCore.getHackathonData(1);
      expect(returnedHackathon).to.equal(hackathonCID);
    });

    it("应该正确返回黑客松总数", async function () {
      expect(await hackXCore.getHackathonCount()).to.equal(0n);
      
      await hackXCore.connect(user1).registerUser("QmUser1Profile");
      await hackXCore.connect(user1).createHackathon("QmTestHackathonCID");
      expect(await hackXCore.getHackathonCount()).to.equal(1n);
    });

    it("应该正确返回项目总数", async function () {
      expect(await hackXCore.getProjectCount()).to.equal(0n);
    });

    it("应该正确返回参与者列表", async function () {
      await hackXCore.connect(user1).registerUser("QmUser1Profile");
      await hackXCore.connect(user2).registerUser("QmUser2Profile");
      await hackXCore.connect(user1).createHackathon("QmTestHackathonCID");
      await hackXCore.connect(user2).joinHackathon(1);
      
      const participants = await hackXCore.getHackathonParticipants(1);
      expect(participants).to.include(user2.address);
    });

    it("应该正确返回用户参与的黑客松列表", async function () {
      await hackXCore.connect(user1).registerUser("QmUser1Profile");
      await hackXCore.connect(user2).registerUser("QmUser2Profile");
      await hackXCore.connect(user1).createHackathon("QmTestHackathonCID");
      await hackXCore.connect(user2).joinHackathon(1);
      
      const userHackathons = await hackXCore.getUserHackathons(user2.address);
      expect(userHackathons).to.include(1n);
    });
  });

  describe("Gas优化测试", function () {
    it("用户注册Gas消耗应该在合理范围内", async function () {
      const profileCID = "QmTestUserProfileCID";
      const tx = await hackXCore.connect(user2).registerUser(profileCID);
      const receipt = await tx.wait();
      
      // Gas消耗应该小于100,000
      expect(Number(receipt.gasUsed)).to.be.lessThan(100000);
    });

    it("黑客松创建Gas消耗应该在合理范围内", async function () {
      await hackXCore.connect(user1).registerUser("QmUser1Profile");
      const hackathonCID = "QmTestHackathonCID";
      const tx = await hackXCore.connect(user1).createHackathon(hackathonCID);
      const receipt = await tx.wait();
      
      // Gas消耗应该小于150,000
      expect(Number(receipt.gasUsed)).to.be.lessThan(150000);
    });
  });

  describe("异常情况处理", function () {
    it("应该正确处理不存在的用户查询", async function () {
      const profile = await hackXCore.getUserProfile(user1.address);
      expect(profile).to.equal("");
    });

    it("应该正确处理不存在的黑客松查询", async function () {
      const hackathon = await hackXCore.getHackathonData(999);
      expect(hackathon).to.equal("");
    });

    it("应该正确处理不存在的项目查询", async function () {
      const project = await hackXCore.getProjectData(999);
      expect(project).to.equal("");
    });

    it("应该正确处理不存在的项目提交查询", async function () {
      const submission = await hackXCore.getProjectSubmission(1, user1.address);
      expect(submission).to.equal("");
    });

    it("应该正确处理不存在的评分查询", async function () {
      const score = await hackXCore.getProjectScore(1, user1.address);
      expect(score).to.equal(0n);
    });
  });
}); 