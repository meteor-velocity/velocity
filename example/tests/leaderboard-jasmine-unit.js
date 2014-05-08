(function () {
    "use strict";

    jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmine.getEnv().defaultTimeoutInterval = 20000;

    describe("Template.leaderboard.players", function () {

        it("asks for the players to be primarily in descending score order, then in alphabetical order and returns as is", function () {
            var someLocalCollectionCursor = {};
            Players.find = function (selector, options) {
                expect(options.sort.score).toBe(-1);
                expect(options.sort.name).toBe(1);
                return someLocalCollectionCursor;
            };
//            expect(Template.leaderboard.players()).toBe(null);
            expect(Template.leaderboard.players()).toBe(someLocalCollectionCursor);
        });
    });

    describe("Template.leaderboard.selected_name", function () {

        it("returns player when player is found and has a name", function () {
            Players.findOne = function () {
                return {name: 'Tom'};
            };
            expect(Template.leaderboard.selected_name()).toBe('Tom');
        });

        it("returns undefined when player.name isn't present", function () {
            Players.findOne = function () {
                return {};
            };
            expect(Template.leaderboard.selected_name()).toBe(undefined);
        });

        it("returns undefined when player doesn't exist", function () {
            Players.findOne = function () {
                return undefined;
            };
            expect(Template.leaderboard.selected_name()).toBe(undefined);
        });

    });

    describe("Template.player.selected", function () {

        it("returns selected when the selected player in the session matches player in the current template", function () {
            Template.player._id = 1234;
            Session.set('selected_player', 1234);
            expect(Template.player.selected()).toBe('selected');
        });

        it("returns empty string when the selected player in the session doesn't matches player in the current template", function () {
            Template.player._id = 4321;
            Session.set('selected_player', 1234);
            expect(Template.player.selected()).toBe('');
        });

    });

    describe("Template.leaderboard [click input.inc] event", function () {

        it("updates the player score by 5 when input.inc is clicked", function () {
            Session.set('selected_player', 1234);
            Players.update = function (selector, options) {
                expect(selector).toBe(1234);
                expect(options.$inc.score).toBe(5);
            };
            Template.leaderboard.fireEvent('click input.inc');
        });

    });

    describe("Template.player [click] event", function () {

        it("clicking a player sets them to the selected player in the session", function () {
            Template.player.addContextAttribute('_id', 888);
            Template.player.fireEvent('click');
            expect(Session.get("selected_player")).toBe(888);
        });

    });

    /*
    describe("moment package", function () {

      it("is stubbed properly", function () {
        var may5 = cincoDeMayo()
        console.log('XXX', typeof may5)
        expect(may5).toBe("May, 05 2014");
      });

    });
    */
})();
