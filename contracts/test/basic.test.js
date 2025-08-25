const { expect } = require("chai");

describe("Basic Test", function () {
  it("should work", function () {
    expect(1 + 1).to.equal(2);
  });

  it("should have chai working", function () {
    expect(true).to.be.true;
    expect(false).to.be.false;
  });
});
