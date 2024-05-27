import { string, array } from 'pipetype'

// call with a function
const typeEmail = Type(str => isEmail(str))

const typeUsaPhone = Type(str => /+1asdef/.test(str))
const englandPhone = Type(str => /+0/.test())


// type
const Person = Type({
  fname: string,
  lname: string | number,
  email: typeEmail,
	phone: typeUsaPhone | englandPhone
})

// object
const Daniel = Person({
	fname: 123,
	lname: 234,
	email: 'daniel'
})

const Amanda = Person({
	fname: "Amanda"
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






fn
1

fn
10

100
1000
10010
