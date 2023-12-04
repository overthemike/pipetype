export type ValidatorFunction<T> = (value: T) => boolean

export type ValidatorMap = Map<bigint, ValidatorFunction<unknown>>

export type TypeDefinitionsMap = Map<string, bigint | ValidatorFunction<unknown>>

export type Struct = {
  [key: string]: bigint | ValidatorFunction<unknown>
}

export type ProxyTarget = {
  [key: string]: Struct | undefined
}

export type StructPropertyArrayMapper = {
  struct: Struct,
  prop: string,
  identifier: bigint
}

// stores whether or not the type definition is an array
export type TypeDefinitionArrayWeakSet = WeakSet<StructPropertyArrayMapper>

