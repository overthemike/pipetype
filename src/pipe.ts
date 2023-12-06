import { typeDefinitions, createType, validatorMap } from "./definitions"
import { Schema, ProxyTarget, NestedObject, ValidationTarget } from "./types";

function createSchema(schema: Schema): Schema {
	// Iterate over the schema object to convert types
	for (const [key, value] of Object.entries(schema)) {
		if (typeof value === 'bigint') {
			// Already a flag, no need to change
			continue;
		} else if (typeof value === 'function') {
			// Convert to type flag
			schema[key] = createType(value);
		} else if (typeof value === 'object') {
			// Nested schema
			schema[key] = createSchema(value);
		} else {
			throw new Error(`Invalid schema type for property '${key}'`);
		}
	}

	return schema;
}


// The Proxy to handle type definitions
export const Type = new Proxy<ProxyTarget>({}, {
	set(target, prop: string, definition) {
		if (prop in target) {
			console.warn(`Type "${String(prop)}" already exists.`);
			return false;
		}

		if (typeof definition === 'object' && definition !== null && !Array.isArray(definition)) {
			const schema = createSchema(definition);
			target[prop] = createValidationProxy(schema);
			typeDefinitions.set(prop, schema);
		} else {
			throw new Error(`Invalid type. Expected an object.`);
		}

		return true;
	},
	get(target, prop: string) {
		if (prop in target) {
			return target[prop];
		}
		throw new Error(`Type '${String(prop)}' is not defined.`);
	}
});

export function createValidationProxy(validationTarget: ValidationTarget) {
	return new Proxy({}, {
		set(target, prop: string, value) {
			if (typeof validationTarget === 'bigint') {
				// Simple type validation
				validateValue(validationTarget, value, `Validation failed for property '${String(prop)}'.`);
			} else if (typeof validationTarget === 'object') {
				// Schema or nested schema validation
				const typeFlagOrNestedSchema = validationTarget[prop];
				if (typeof typeFlagOrNestedSchema === 'bigint') {
					// Property is a simple type
					validateValue(typeFlagOrNestedSchema, value, `Validation failed for property '${String(prop)}'.`);
				} else if (typeof typeFlagOrNestedSchema === 'object') {
					// Property is a nested schema
					if (!validateNestedObject(typeFlagOrNestedSchema, value)) {
						throw new Error(`Validation failed for nested object '${String(prop)}'.`);
					}
				} else {
					throw new Error(`Property '${String(prop)}' does not have a valid type or nested schema.`);
				}
			} else {
				throw new Error(`Property '${String(prop)}' is not defined in the schema.`);
			}

			return Reflect.set(target, prop, value);
		}
	});
}

function validateValue(typeFlag: bigint, value: any, errorMessage: string) {
	let isValid = false;

	for (const [validatorFlag, validatorFn] of validatorMap.entries()) {
		if ((typeFlag & validatorFlag) === validatorFlag && validatorFn(value)) {
			isValid = true;
			break;
		}
	}

	if (!isValid) {
		throw new Error(errorMessage);
	}
}

function validateNestedObject(nestedSchema: Schema, value: NestedObject): boolean {
	if (typeof value !== 'object' || value === null) {
		return false; // Not a valid object
	}

	const validationProxy: NestedObject = createValidationProxy(nestedSchema);
	for (const key in nestedSchema) {
		if (nestedSchema.hasOwnProperty(key)) {
			try {
				validationProxy[key] = value[key];
			} catch (error) {
				return false; // Validation failed
			}
		}
	}

	return true; // All validations passed
}

