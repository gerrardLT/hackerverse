const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Simple Test", function () {
  it("should work", function () {
    expect(1 + 1).to.equal(2);
  });

  it("should deploy contract", async function () {
    const [owner] = await ethers.getSigners();
    const HackXCoreFactory = await ethers.getContractFactory("HackXCore");
    const hackXCore = await HackXCoreFactory.deploy();
    await hackXCore.waitForDeployment();
    
    expect(hackXCore).to.not.be.undefined;
  });
}); 