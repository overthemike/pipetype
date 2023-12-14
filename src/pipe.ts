import {
	typeDefinitions,
	createType,
	validatorMap,
	typeArrays,
	readonlyProperties,
	typeSchemas,
	getNextFlag,
	schemaTypeMap,
} from './definitions'
// import { TypeInstance } from './instance'
import {
	Schema,
	ProxyTarget,
	NestedObject,
	ValidationTarget,
	CallableSchema,
	DynamicProxyObject,
	SchemaProxy,
} from './types'

// The Proxy to handle type definitions
export const Type = new Proxy<ProxyTarget>({} as ProxyTarget, {
	set(target, prop: string, definition) {
		if (prop in target) {
			console.warn(`Type "${String(prop)}" already exists.`)
			return false
		}

		if (typeof definition === 'bigint') {
			target[prop] = createValidationProxy(definition)
			typeDefinitions.set(prop, definition)
		}

		if (
			typeof definition === 'object' &&
			definition !== null &&
			!Array.isArray(definition)
		) {
			const schema = createSchema(definition)

			const schemaFlag = getNextFlag()
			typeSchemas.set(schemaFlag, prop)
			schemaTypeMap.set(prop, schemaFlag)

			target[prop] = createValidationProxy(schema)
			typeDefinitions.set(prop, schema)
		} else {
			throw new Error(`Invalid type. Expected an object.`)
		}

		return true
	},
	get(target, prop: string) {
		if (prop in target) {
			const schemaFlag = typeDefinitions.get(prop)

			if (typeof schemaFlag === 'bigint') {
				// Create a Proxy that acts both as a function and a bigint
				const schemaProxy = new Proxy(
					{},
					{
						apply: function (_target, _thisArg, _argumentsList) {
							// Function call logic here
							const schemaName = typeSchemas.get(schemaFlag)
							if (!schemaName || typeof schemaName !== 'string') {
								throw new Error(`Schema name not found for type '${prop}'.`)
							}
							const schema = typeDefinitions.get(schemaName)
							if (!schema) {
								throw new Error(`Schema not found for type '${prop}'.`)
							}
							return createValidationProxy(schema)
						},
						get: function (_target, key) {
							// Return bigint flag when accessed as a property
							if (key === 'toString') {
								return () => schemaFlag.toString()
							}
							// Use the specific arguments needed for Reflect.get
							// return Reflect.get(_target, key)
							const flag = schemaTypeMap.get(prop)
							return flag
						},
					}
				)

				return schemaProxy as SchemaProxy
			} else if (typeof schemaFlag === 'object') {
				// Create a Proxy that acts both as a function and an object
				const schemaProxy = new Proxy(
					{},
					{
						apply: function (_target, _thisArg, _argumentsList) {
							// Function call logic here
							return createValidationProxy(schemaFlag) // Returning the object directly
						},
						get: function (_target, key): DynamicProxyObject | bigint {
							// Delegate to the object itself
							if (key in schemaFlag) {
								return createValidationProxy(schemaFlag[key])
							}

							// Fallback or custom logic for other keys
							const flag = createType(() => true)
							return flag
						},
					}
				)

				return schemaProxy as SchemaProxy
			} else {
				throw new Error(`Type '${prop}' is not a defined schema.`)
			}
		}
		// Default behavior if property is not found
		throw new Error(`Type '${prop}' is not a defined schema.`)
	},

	apply: function (_target, _thisArg, [schema]) {
		if (
			typeof schema !== 'object' ||
			schema === null ||
			Array.isArray(schema)
		) {
			throw new Error('Invalid schema. Expected an object.')
		}

		// Generate a unique Symbol as an identifier for this type
		const typeSymbol = Symbol('DynamicType')

		const processedSchema = createSchema(schema)
		const typeFlag = createType(() => true) // no type validation required for outermost Type()

		// Associate the schema with the unique Symbol in typeDefinitions
		typeDefinitions.set(typeSymbol, processedSchema)

		return typeFlag
	},
}) as ProxyTarget & (() => CallableSchema)

export function readOnlyCheck(flag: bigint, value: any) {
	const readOnly = readonlyProperties.has(flag)

	if (readOnly) {
		if (value !== undefined) {
			throw new Error('Trying to set value on read only property')
		}
	}
}

export function createValidationProxy(validationTarget: ValidationTarget) {
	return new Proxy(
		{},
		{
			set(target, prop: string | symbol, value) {
				if (typeof validationTarget === 'bigint') {
					// Simple type validation
					readOnlyCheck(validationTarget, Reflect.get(target, prop))
					validateValue(
						validationTarget,
						value,
						`Validation failed for property '${String(prop)}'.`
					)
				} else if (typeof validationTarget === 'object') {
					// Schema or nested schema validation
					const typeFlagOrNestedSchema = validationTarget[prop]
					if (typeof typeFlagOrNestedSchema === 'bigint') {
						readOnlyCheck(typeFlagOrNestedSchema, Reflect.get(target, prop))
						// Property is a simple type
						validateValue(
							typeFlagOrNestedSchema,
							value,
							`Validation failed for property '${String(prop)}'.`
						)
					} else if (typeof typeFlagOrNestedSchema === 'object') {
						// Property is a nested schema
						if (!validateNestedObject(typeFlagOrNestedSchema, value)) {
							throw new Error(
								`Validation failed for nested object '${String(prop)}'.`
							)
						}
					} else {
						throw new Error(
							`Property '${String(
								prop
							)}' does not have a valid type or nested schema.`
						)
					}
				} else {
					throw new Error(
						`Property '${String(prop)}' is not defined in the schema.`
					)
				}

				return Reflect.set(target, prop, value)
			},
		}
	)
}

export function createSchema(
	schema: Schema,
	isParentReadonly: boolean = false
): Schema {
	const processedSchema: Schema = {}

	for (const [key, value] of Object.entries(schema)) {
		// Check if the current property is explicitly marked as readonly
		const isReadonly = key.startsWith('readonly_') || isParentReadonly
		const actualKey = isReadonly ? key.replace(/^readonly_/, '') : key

		if (typeof value === 'bigint') {
			// Already a flag, no need to change, but apply actualKey for readonly
			processedSchema[actualKey] = value
			if (isReadonly) {
				readonlyProperties.add(value) // Assuming readonlyProperties is a Set
			}
		} else if (typeof value === 'function') {
			// Convert function to type flag, apply actualKey for readonly
			processedSchema[actualKey] = createType(value)
			if (isReadonly) {
				readonlyProperties.add(processedSchema[actualKey] as bigint) // Assuming readonlyProperties is a Set
			}
		} else if (
			typeof value === 'object' &&
			value !== null &&
			!Array.isArray(value)
		) {
			// Nested schema, recursively process with readonly status
			processedSchema[actualKey] = createSchema(value, isReadonly)
		} else {
			throw new Error(`Invalid schema type for property '${key}'`)
		}
	}

	return processedSchema
}

function validateValue(typeFlag: bigint, value: any, errorMessage: string) {
	let isValid = false

	if (typeArrays.has(typeFlag)) {
		// The typeFlag is an array type
		if (!Array.isArray(value)) {
			throw new Error(`Expected an array for ${errorMessage}`)
		}

		// Retrieve the validator function for the array's type
		const validatorFn = Array.from(validatorMap.entries()).find(
			([validatorFlag, _]) => (typeFlag & validatorFlag) === validatorFlag
		)?.[1]

		if (!validatorFn) {
			throw new Error(`No validator found for array type: ${errorMessage}`)
		}

		// Validate each item in the array
		isValid = value.every((item) => validatorFn(item))
	} else {
		// Single value validation
		for (const [validatorFlag, validatorFn] of validatorMap.entries()) {
			if ((typeFlag & validatorFlag) === validatorFlag && validatorFn(value)) {
				isValid = true
				break
			}
		}
	}

	if (!isValid) {
		throw new Error(errorMessage)
	}
}

function validateNestedObject(
	nestedSchema: Schema,
	value: NestedObject
): boolean {
	if (typeof value !== 'object' || value === null) {
		return false // Not a valid object
	}

	const validationProxy: NestedObject = createValidationProxy(nestedSchema)
	for (const key in nestedSchema) {
		if (nestedSchema.hasOwnProperty(key)) {
			try {
				validationProxy[key] = value[key]
			} catch (error) {
				return false // Validation failed
			}
		}
	}

	return true // All validations passed
}
