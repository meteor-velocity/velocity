
@Players = new Meteor.Collection 'players'

if Meteor.isClient
  Template.leaderboard.players = ->
    Players.find {}, {sort: {score: -1, name: 1}}

  Template.leaderboard.selected_name = ->
    player = Players.findOne Session.get 'selected_player'
    player and player.name

  Template.player.selected = ->
    if Session.equals('selected_player', @_id) then 'selected' else ''

  Template.leaderboard.events
    'click input.inc': ->
      Players.update Session.get('selected_player'), {$inc: {score: 5}}

  Template.player.events
    'click': ->
      Session.set 'selected_player', @_id

if Meteor.isServer

  # use a package so we can verify package auto-stubbing works
  root = exports ? this
  root.cincoDeMayo = moment("2014-05-05T09:30:30.000").format("MMM, DD YYYY")

  Meteor.startup ->
    if Players.find().count() is 0
      names = ['Ada Lovelace', 'Grace Hopper', 'Marie Curie', 'Carl Friedrich Gauss', 'Nikola Tesla', 'Claude Shannon']
      names.forEach (name) ->
        Players.insert {name: name, score: Math.floor (Math.random()*10)*5}
