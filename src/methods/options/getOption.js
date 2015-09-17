/**
 * Get an option
 *
 * @method velocity/getOption
 * @param {String} name The name of the option.
 * @return {*} The value of the option or null.
 */
Velocity.Methods['velocity/getOption'] = function (name) {
  check(name, String);

  var option = Velocity.Collections.Options.findOne({name: name});
  return option ? option.value : null;
};
