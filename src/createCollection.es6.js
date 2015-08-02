var getDefaultCollectionOptions = _.memoize(function getCollectionOptions() {
  var collectionOptions = {};
  if (Meteor.isServer) {
    var velocityMongoUrl = process.env.VELOCITY_MONGO_URL;
    if (velocityMongoUrl) {
      collectionOptions._driver = new MongoInternals.RemoteCollectionDriver(velocityMongoUrl);
    }
  }
  return collectionOptions;
});


VelocityInternals.createCollection = function (name, options = {}) {
  options = _.defaults({}, options, getDefaultCollectionOptions());
  return new Mongo.Collection(name, options);
};
