import { type ValidatorFunction, type PrimitiveType,  } from "../types"

export function fnProxy(validatorFunction: ValidatorFunction) {
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
