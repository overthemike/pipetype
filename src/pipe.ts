import {
	typeDefinitions,
	createType,
	validatorMap,
	typeArrays,
	readonlyProperties,
} from './definitions'
import { TypeInstance } from './instance'
import {
	Schema,
	ProxyTarget,
	NestedObject,
	ValidationTarget,
	DynamicProxyObject,
} from './types'

// The Proxy to handle type definitions
export const Type = new Proxy<ProxyTarget>(
	{},
	{
		set(target, prop: string | symbol, definition) {
			if (prop in target) {
				console.warn(`Type "${String(prop)}" already exists.`)
				return false
			}

			if (
				typeof definition === 'object' &&
				definition !== null &&
				!Array.isArray(definition)
			) {
				const schema = createSchema(definition)

				target[prop] = createValidationProxy(schema)
				typeDefinitions.set(prop, schema)
			} else {
				throw new Error(`Invalid type. Expected an object.`)
			}

			return true
		},
		get(target, prop: string) {
			if (prop in target) {
				// Return the unique flag associated with this type
				const typeInfo = target[prop]
				return typeof typeInfo === 'bigint'
					? typeInfo
					: createValidationProxy(typeInfo)
			}

			// Handle cases where the type is not predefined
			const propProxy = createSchemaObjectProxy(prop)
			return propProxy
		},
		apply: function (target, thisArg, [schema]) {
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
	}
)

function createSchemaObjectProxy(theName: string) {
	return new Proxy<DynamicProxyObject>(
		{},
		{
			/**
			 * Calling Type() without new will create our type "service" or "utility"
			 *	(looking for a better name for this) object.
			 *	This will provide functions we can run on objects without committing
			 *	them by instantiation. Essentially static one time use functions.
			 *
			 * This object will have functions lke parse(), validate()
			 */
			apply: function (target, thisArg, argumentsList) {
				// Retrieve the schema from typeDefinitions using theName
				const schema = typeDefinitions.get(theName)
				if (!schema) {
					throw new Error(`Schema not found for type '${theName}'`)
				}

				// Create and populate the type instance
				if (typeof schema === 'object') {
					const typeInstance = new TypeInstance(schema)

					return typeInstance
				}
			},
			/**
			 * This will create instantiation of the provided type with all of the properties
			 * and rules associated with it. Whatever values you pass in will be immediately
			 * validated and committed to that object.
			 * @param target
			 * @param argArray
			 * @param newTarget
			 */
			construct(target, argArray, newTarget) {
				const schema = typeDefinitions.get(theName)
				if (typeof schema !== 'object' || typeof schema !== 'bigint') {
					throw new Error(`Schema not found for type '${theName}'`)
				}

				// Create and populate the type instance
				const typeInstance = new TypeInstance(schema)
				return typeInstance
			},
		}
	)
}

export function createValidationProxy(validationTarget: ValidationTarget) {
	return new Proxy(
		{},
		{
			set(target, prop: string | symbol, value) {
				if (typeof validationTarget === 'bigint') {
					// Simple type validation
					validateValue(
						validationTarget,
						value,
						`Validation failed for property '${String(prop)}'.`
					)
				} else if (typeof validationTarget === 'object') {
					// Schema or nested schema validation
					const typeFlagOrNestedSchema = validationTarget[prop]
					if (typeof typeFlagOrNestedSchema === 'bigint') {
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
		} else if (typeof value === 'function') {
			// Convert function to type flag, apply actualKey for readonly
			processedSchema[actualKey] = createType(value)
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

		// Store readonly status if the property or its parent is readonly
		if (isReadonly) {
			readonlyProperties.add(actualKey) // Assuming readonlyProperties is a Set
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
