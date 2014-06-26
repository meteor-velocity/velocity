if (!(typeof MochaWeb === 'undefined')){
  MochaWeb.testOnly(function(){
    describe("Server initialization", function(){
      it("should insert 6 players into the database after server start", function(){
        chai.assert.equal(Players.find().count(), 6);
      });
    });
  });
}
