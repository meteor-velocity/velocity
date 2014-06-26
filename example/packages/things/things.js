thing1 = {
  name: "Thing1",
  foo: function () {
    console.log('called thing1.foo')
  },
  bar: function () {
    console.log('called thing1.bar')
  }
}

thing2 = {
  name: "Thing2",
  foo: function () {
    console.log('called thing2.foo')
  },
  bar: function () {
    console.log('called thing2.bar')
  }
}

thing3 = function () {
  return { name: "Thing3" }
}

thing4 = function (requiredParam) {
  if (!requiredParam) {
    throw new Error("[Thing4] Missing required parameter")
  }

  return { name: "Thing4" }
}
