# Environment Variables

### VELOCITY_CI

Set to 1 when the app is started in CI mode. This is set automatically by our Meteor fork when you run `meteor --test`.

### VELOCITY_HUB

Set to 1 when the app is a Velocity Hub

### VELOCITY_APP_PATH

When the app is a Velocity Hub, this is set to the path of the app that is tested.
We need this because for now the mirrors are spawned by the Hub.

### VELOCITY_MONGO_URL

The url to the MongoDB that should be used for mirrors.
