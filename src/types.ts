export type ValidatorFunction<T> = (value: T) => boolean

export type ValidatorMap = Map<bigint, ValidatorFunction<any>>

export type TypeDefinitionsMap = Map<string | symbol, bigint | Schema>

export type TypeSchemaMap = Map<bigint, string | symbol>

export type Schema = {
	[key: string | symbol]: bigint | Schema
}

export type ProxyTarget = {
	[key: string | symbol]: Schema
}

export type ParseResult = {
	status: 'valid' | 'invalid' | 'aborted'
	data: any
}

export type DynamicProxyObject = {
	[key: string | symbol]: any
}

export type TransformFunction = <T>(value: T) => any

export type BigIntSet = Set<bigint>
export type ReadyOnlyProperties = Set<bigint>
export type DefaultValueMap = Map<bigint | Schema, any>
export type OptionalValueSet = Set<bigint | Schema>
export type TypeDescriptionMap = Map<bigint | Schema, string>
export type TypeTransformFunctionMap = Map<bigint | Schema, TransformFunction>

export type ValidationTarget = bigint | Schema

export type NestedObject<T = unknown> = {
	[key: string]: T
}

export type Literal = string | number | boolean | bigint | symbol

export type DescriptionObject = {
	type: ValidationTarget | symbol
	validate?: ValidatorFunction<unknown> | symbol
	defaultValue?: unknown
	optional?: boolean
	description?: string
	transform?: TransformFunction | symbol
}
export type DescribeFunction = (options: DescriptionObject) => bigint
