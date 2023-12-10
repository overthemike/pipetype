import Type, { number, string, boolean, createType } from './src/main'

const isEmail = (str) => {
	const regex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
	return regex.test(str)
}

const Email = createType(str => isEmail(str))

const User = Type.User = {
	id: number | string,
	username: string,
	isActive: boolean,
	email: createType(str => isEmail(str))
}

Type.Profile = {
	user: User,

}


const userService = Type.User() // static methods without instanstiation
userService.parse()
userService.safeParse()


const userObject = new Type.User() // instantiate new class with all of the rules
