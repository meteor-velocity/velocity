Package.describe({
  summary: "Things to test package auto-stubbing"
});

Package.on_use(function (api, where) {
  if(api.export) {
    api.export('thing1');
    api.export('thing2');
  }
  where = where || ['client', 'server'];
  api.add_files('things.js', where);
});
