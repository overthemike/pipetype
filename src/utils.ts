let typeFlag = 1n

export function getNextTypeFlag(): bigint {
	typeFlag <<= 1n
	return typeFlag
}

export function createType(): bigint {}

export function createSchema(): bigint {}
