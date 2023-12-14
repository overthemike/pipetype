import {
	ValidatorFunction,
	TypeDefinitionsMap,
	ValidatorMap,
	BigIntSet,
	Literal,
	ReadyOnlyProperties,
	DescribeFunction,
	DescriptionObject,
	DefaultValueMap,
	OptionalValueSet,
	TypeDescriptionMap,
	TypeTransformFunctionMap,
	ValidationTarget,
	TypeSchemaMap,
	SchemaTypeMap,
} from './types'

// keeps track of last used bigint
let lastFlag = 1n

// A Validator Map is how we link a bigint value to a validation function
export const validatorMap: ValidatorMap = new Map()

/**
 *  The type definition map stores type properties and *evaluated* bigints or a validation function
 *  An *evaluated* bigint can be a union of multiple types merged together via bitwise OR operation
 *  This gives us all the info we need to find all of the different union types to validate in a single
 *  bigint.
 *  For Example: (though implemented more simply)
 *
 *  const string  = 0b001n
 *  const number  = 0b010n
 *  const boolean = 0b100n
 *  ...etc
 *
 *  Type.User = {
 *    id: string | number  <- this will evaluate to 3n
 *  }
 *
 *  We can then use these numbers to know exactly which validation functions to run as each bigint
 *  is mapped to a single validation function. 3n === 0b011 - a flag for both string and number but
 *  not for boolean. This is what allows for union types.
 *
 *  If a function is passed in instead, we will store a new ValidatorFunction in the ValidatorMap
 *  with a new bigint value associated with it and then store the bigint value in this map
 */
export const typeDefinitions: TypeDefinitionsMap = new Map()
export const typeSchemas: TypeSchemaMap = new Map()
export const schemaTypeMap: SchemaTypeMap = new Map()

// Left shift to create the next avaialble bit for our new type
export function getNextFlag(): bigint {
	lastFlag <<= 1n
	return lastFlag
}

export const typeArrays: BigIntSet = new Set()
export const tupleTypes: BigIntSet = new Set()
export const readonlyProperties: ReadyOnlyProperties = new Set()

export const defaultValues: DefaultValueMap = new Map()
export const optionalValues: OptionalValueSet = new Set()
export const typeDescriptions: TypeDescriptionMap = new Map()
export const typeTransformations: TypeTransformFunctionMap = new Map()

export function createType<T>(validator: ValidatorFunction<T>): bigint {
	const newFlag = getNextFlag()
	validatorMap.set(newFlag, validator as ValidatorFunction<unknown>)
	return newFlag
}

export const any = createType<any>(() => true)
export const unknown = createType<unknown>(
	(value) => value !== undefined && value !== null
)
export const string = createType<string>((value) => typeof value === 'string')
export const number = createType<number>((value) => typeof value === 'number')
export const boolean = createType<boolean>(
	(value) => typeof value === 'boolean'
)
export const bigint = createType<bigint>((value) => typeof value === 'bigint')
export const symbol = createType<symbol>((value) => typeof value === 'symbol')
export const nil = createType<null>((value) => value === null)
export const undef = createType<undefined>((value) => value === undefined)
export const nullish = createType<null | undefined>(
	(value) => value === undefined || value === null
)
export const date = createType<Date>(
	(value) => Object.prototype.toString.call(value) === '[object Date]'
)

export const array = (type: bigint): bigint => {
	if (validatorMap.has(type)) {
		const validatorFunction = validatorMap.get(type)
		if (!validatorFunction) {
			throw new Error('Validator function not found for the provided type')
		}
		const flag = createType(validatorFunction)
		typeArrays.add(flag)

		return flag
	} else {
		throw new Error('The type you provided to array() was not found')
	}
}

// A special function for tuples
export const tuple = (...types: bigint[]): bigint => {
	// Create a unique flag for this specific tuple combination
	const flag = getNextFlag()

	const tupleValidator: ValidatorFunction<any[]> = (...args) => {
		if (args.length !== types.length) {
			return false
		}

		return args.every((arg, index) => {
			const validatorFn = validatorMap.get(types[index])
			return validatorFn ? validatorFn(arg) : false
		})
	}

	// Store the tuple validator with the unique flag
	validatorMap.set(flag, tupleValidator as ValidatorFunction<unknown>)
	tupleTypes.add(flag)
	return flag
}

export const literal = (literal: Literal) =>
	createType((value: Literal) => value === literal)

// enum is a reserved typescript keyword
export const enom = (...literals: Literal[] | string[]): bigint => {
	const enumValidator: ValidatorFunction<any> = (value) => {
		return literals.includes(value)
	}

	return createType(enumValidator)
}

const uninitType = Symbol('Uninitialized Type')
const uninitValidatorFunction = Symbol('Uninitialzed Validator Function')
const uninitTransformFunction = Symbol('Unintialized Transform Function')

const defaultOptions = {
	type: uninitType,
	validate: uninitValidatorFunction,
	defaultValue: null,
	optional: false,
	description: '',
	transform: uninitTransformFunction,
} as const

export const expound: DescribeFunction = (
	options: DescriptionObject
): bigint => {
	const opts = { ...defaultOptions, ...options }
	const { type, validate, defaultValue, optional, description, transform } =
		opts

	let flag: ValidationTarget

	if (typeof type === 'symbol') {
		// validation function should be provided
		if (validate === uninitValidatorFunction) {
			throw new Error('Must provide either a type or a validate function')
		} else {
			flag = createType(validate as ValidatorFunction<unknown>)
		}
	} else {
		flag = type
	}

	if (defaultValue) {
		defaultValues.set(flag, defaultValue)
	}

	if (optional) {
		optionalValues.add(flag)
	}

	if (description !== '') {
		typeDescriptions.set(flag, description)
	}

	if (typeof transform === 'function') {
		typeTransformations.set(flag, transform)
	}

	return flag as bigint
}
