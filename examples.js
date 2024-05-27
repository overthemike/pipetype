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
const foob  = Type(string | Email)


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


const Async = new Proxy()

const AsyncFuncType = Async(fn([number, number], number))

const foo = {
	someAsyncPropertyFunction: AsyncFuncType(async ())
}



// const asyn = new Proxy(asyncFunction, {
// 	...
// })

// const AsyncFnType = asyn(fn([number, number], number))

// const doSomethingAsync = AsyncFnType(async (num1, num2) => await setTimeout(...))
