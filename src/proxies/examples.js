

// call with a function
const Email = Type(str => isEmail(str))


// as an object
const Person = Type({
  fname: string,
  lname: string,
  email: Email
})



// as a flag
const foo = Type(string | Email)


// optional
const Profile = Type({
  'address?': string,
  optional_address: string
})


// readonly
const More = Type({
  'address*': string,
  readonly_address: string
})


