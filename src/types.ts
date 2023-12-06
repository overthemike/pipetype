export type ValidatorFunction<T> = (value: T) => boolean

export type ValidatorMap = Map<bigint, ValidatorFunction<any>>

export type TypeDefinitionsMap = Map<string | symbol, bigint | Schema>

export type Schema = {
	[key: string | symbol]: bigint | Schema
}

export type ProxyTarget = {
	[key: string | symbol]: Schema
}

// stores whether or not the type definition is an array
export type TypeDefinitionArraySet = Set<bigint>

export type ValidationTarget = bigint | Schema;

export type NestedObject<T = unknown> = {
	[key: string]: T
}
