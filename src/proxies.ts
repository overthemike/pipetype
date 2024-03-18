import { readonlyProperties } from './definitions'

// TYPES
export type ValidatorFunction = (value: unknown) => boolean
export type Schema = {
	[key: string | symbol]: bigint | Schema
}
export type TypeFunctionParameter = ValidatorFunction | Schema | bigint
export const error = (msg: string) => {
	throw new Error(msg)
}
export type PrimitiveType = number | string | bigint | boolean
export type PrimitiveFunction = {
	(): any
	[Symbol.toPrimitive]?: (hint: string) => number | bigint | string | boolean
}
export type FlagToValidatorMap = Map<bigint, ValidatorFunction>
export type FlagToSchemaMap = Map<bigint, Schema>

/**
 * The last bit available for use as a flag. Each validator function,
 * each property and each schema will all have their own flags
 */
let lastFlag = 1n

/**
 * Map from bigint flag to ValidatorFn
 */
export const FlagToValidatorMap: FlagToValidatorMap = new Map()

/**
 * Map from bigint flag to object schema
 */
export const FlagToSchemaMap: FlagToSchemaMap = new Map()

// Left shift to create the next avaialble bit for our new type
export function getNextFlag(): bigint {
	lastFlag <<= 1n
	return lastFlag
}

/**
 *
 * @param validator - The validator function to be used for this type
 * @returns bigint - The bit location within a bigint
 */
export function createType(validator: ValidatorFunction): bigint {
	const newFlag = getNextFlag()
	FlagToValidatorMap.set(newFlag, validator)
	return newFlag
}

export function createSchema(schema: Schema): bigint {
	if (typeof schema !== 'object') {
		throw new Error('Schema must be an object')
	}
	const newFlag = getNextFlag()
	const processedSchema: Schema = {}

	for (const [key, value] of Object.entries(schema)) {
		if (typeof value === 'bigint') {
			processedSchema[key] = value
		} else if (typeof value === 'function') {
			processedSchema[key] = createType(value)
		} else if (
			typeof value === 'object' &&
			value !== null &&
			!Array.isArray(value)
		) {
			// Nested schema, recursively process with readonly status
			processedSchema[key] = createSchema(value)
		} else {
			throw new Error(`Invalid schema type for property '${key}'`)
		}
	}

	FlagToSchemaMap.set(newFlag, schema)
	return newFlag
}

// PROXIES
export const Type = (param: TypeFunctionParameter) => {
	if (typeof param === 'function') {
		return fnProxy(param)
	}

	if (typeof param === 'object') {
		return objProxy(param)
	}

	if (typeof param === 'bigint') {
		return flagProxy(param)
	}

	throw new Error('Invalid parameter passed to Type function')
}

function fnProxy(validatorFunction: ValidatorFunction) {
	const flag = createType(validatorFunction)

	const createTypeObject: PrimitiveFunction = function (): (
		value: any
	) => boolean {
		return (value) => {
			if (!validatorFunction(value)) {
				throw new Error(`Type validation failed for value: ${value}`)
			}

			return true
		}
	}

	createTypeObject[Symbol.toPrimitive] = function (
		hint: string
	): PrimitiveType {
		if (hint === 'number') {
			return BigInt(flag) // Return a BigInt when a number is expected
		}
		if (hint === 'string') {
			return validatorFunction.toString()
		}
		return true
	}

	const proxy = new Proxy(createTypeObject, {
		get(target: PrimitiveFunction, prop: PropertyKey, receiver: any) {
			if (prop === Symbol.toPrimitive) {
				const originalToPrimitive = target[Symbol.toPrimitive]
				if (typeof originalToPrimitive === 'function') {
					let boundFunction: PrimitiveFunction = function (...args: any) {
						return originalToPrimitive.apply(target, args)
					}

					boundFunction[Symbol.toPrimitive] = (
						originalToPrimitive as Function
					).bind(target)
					return boundFunction[Symbol.toPrimitive]
				}
			}
			return Reflect.get(target, prop, receiver)
		},
	})

	return proxy
}

function objProxy(obj: Schema) {
	const flag = createSchema(obj)

	const createTypeObject: PrimitiveFunction = function (): void {
		
	}

	createTypeObject[Symbol.toPrimitive] = function (
		hint: string
	): PrimitiveType {
		if (hint === 'number') {
			return BigInt(flag) // Return a BigInt when a number is expected
		}
		if (hint === 'string') {
			return obj.toString()
		}
		return true
	}

	const proxy = new Proxy(createTypeObject, {
		get(target: PrimitiveFunction, prop: PropertyKey, receiver: any) {
			if (prop === Symbol.toPrimitive) {
				const originalToPrimitive = target[Symbol.toPrimitive]
				if (typeof originalToPrimitive === 'function') {
					let boundFunction: PrimitiveFunction = function (...args: any) {
						return originalToPrimitive.apply(target, args)
					}
					// Assert that originalToPrimitive is a function before calling bind
					boundFunction[Symbol.toPrimitive] = (
						originalToPrimitive as Function
					).bind(target)
					return boundFunction[Symbol.toPrimitive]
				}
			}
			return Reflect.get(target, prop, receiver)
		},
	})

	return proxy
}

function flagProxy(flag: bigint) {
	const validatorFunction = FlagToValidatorMap.get(flag)

	if (!validatorFunction) {
		throw new Error(`Validator function not found for flag: ${flag}`)
	}

	const createTypeObject: PrimitiveFunction = function (): (
		value: any
	) => boolean {
		return (value) => {
			if (!validatorFunction(value)) {
				throw new Error(`Type validation failed for value: ${value}`)
			}

			return true
		}
	}

	createTypeObject[Symbol.toPrimitive] = function (
		hint: string
	): PrimitiveType {
		if (hint === 'number') {
			return BigInt(flag) // Return a BigInt when a number is expected
		}
		if (hint === 'string') {
			return validatorFunction.toString()
		}
		return true
	}

	const proxy = new Proxy(createTypeObject, {
		get(target: PrimitiveFunction, prop: PropertyKey, receiver: any) {
			if (prop === Symbol.toPrimitive) {
				const originalToPrimitive = target[Symbol.toPrimitive]
				if (typeof originalToPrimitive === 'function') {
					let boundFunction: PrimitiveFunction = function (...args: any) {
						return originalToPrimitive.apply(target, args)
					}
					// Assert that originalToPrimitive is a function before calling bind
					boundFunction[Symbol.toPrimitive] = (
						originalToPrimitive as Function
					).bind(target)
					return boundFunction[Symbol.toPrimitive]
				}
			}
			return Reflect.get(target, prop, receiver)
		},
	})

	return proxy
}
