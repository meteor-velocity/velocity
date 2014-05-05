//something here
var assert = Npm.require("assert");

describe("The First Group", function(){
  it("The First Test", function(){
    console.log("mocha-web: First test executed");
    assert(true, "a very true test");
  })
});
