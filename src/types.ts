export type ValidatorFunction<T> = (value: T) => boolean

export type ValidatorMap = Map<bigint, ValidatorFunction<any>>

export type TypeDefinitionsMap = Map<string, bigint | Schema>

export type Schema = {
	[key: string]: bigint | Schema
}

export type ProxyTarget = {
	[key: string]: Schema
}

export type SchemaPropertyArrayMapper = {
	schema: Schema,
	prop: string,
	identifier: bigint
}

// stores whether or not the type definition is an array
export type TypeDefinitionArrayWeakSet = WeakSet<SchemaPropertyArrayMapper>

export type ValidationTarget = bigint | Schema;

export type NestedObject<T = unknown> = {
	[key: string]: T
}
