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
