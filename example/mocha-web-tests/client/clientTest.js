MochaWeb.testOnly(function(){
  describe("A client group", function(){
    it("the client test", function(){
      console.log("mocha-web client: First test running");
      chai.assert(true, "a very true test");
    })
    console.log("DESCRIPTION COMPLETE");
  });
});
