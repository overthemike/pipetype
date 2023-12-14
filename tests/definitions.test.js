const {
	getNextFlag,
	createType,
	any,
	unknown,
	string,
	number,
	boolean,
	bigint,
	symbol,
	nil,
	undef,
	nullish,
	date,
	array,
	tuple,
	literal,
	enom,
	expound,
	validatorMap,
	default: Type,
} = require('../dist/pipetype.umd.cjs')
const { expect, test } = require('@jest/globals')
describe('test suite', () => {
	describe('Test all provided validators', () => {
		Type.All = {
			anyProp: any,
			unknownProp: unknown,
			stringProp: string,
			numberProp: number,
			booleanProp: boolean,
			bigintProp: bigint,
			symbolProp: symbol,
			nilProp: nil,
			undefProp: undef,
			nullishProp: nullish,
			dateProp: date,
			arrayProp: array(string),
			tupleProp: tuple(string, string),
			literalProp: literal('literal'),
			enomProp: enom('foo', 'bar', 'baz'),
			describeProp: expound({
				type: string,
			}),
		}

		const all = Type.All()

		test('any', () => {
			expect(() => (all.anyProp = 'asfd')).toBeTruthy()
		})

		test('unknown', () => {
			expect(() => (all.unknownProp = 'asdf')).toBeTruthy()
			expect(() => (all.unknownProp = undefined)).toThrow()
		})

		test('string', () => {
			expect(() => (all.stringProp = 'asdf')).toBeTruthy()
			expect(() => (all.stringProp = 3)).toThrow()
		})
		test('number', () => {
			expect(() => (all.numberProp = 3)).toBeTruthy()
			expect(() => (all.numberProp = 'asfd')).toThrow()
		})
		test('boolean', () => {
			expect(() => (all.booleanProp = true)).toBeTruthy()
			expect(() => (all.booleanProp = 'asdf')).toThrow()
		})
		test('bigint', () => {
			expect(() => (all.bigintProp = 123n)).toBeTruthy()
			expect(() => (all.bigintProp = 'asdf')).toThrow()
		})
		test('symbol', () => {
			expect(() => (all.symbolProp = Symbol('asdf'))).toBeTruthy()
			expect(() => (all.symbolProp = 'asdf')).toThrow()
		})
		test('nil', () => {
			expect(() => (all.nilProp = null)).toBeTruthy()
			expect(() => (all.nilProp = undefined)).toThrow()
		})
		test('undef', () => {
			expect(() => (all.undefProp = undefined)).toBeTruthy()
			expect(() => (all.undefProp = null)).toThrow()
		})
		test('nullish', () => {
			expect(() => (all.nullishProp = null)).toBeTruthy()
			expect(() => (all.nullishProp = undefined)).toBeTruthy()
			expect(() => (all.nullishProp = '')).toThrow()
		})
		test('date', () => {
			expect(() => (all.dateProp = new Date())).toBeTruthy()
			expect(() => (all.dateProp = '12/12/12')).toThrow()
		})
		test('array', () => {
			expect(() => (all.arrayProp = ['asdf', 'sadf', '2', ''])).toBeTruthy()
			expect(() => (all.arrayProp = 'asdf')).toThrow()
			expect(() => (all.arrayProp = [2, 3, 4])).toThrow()
		})
		test('tuple', () => {
			expect(() => (all.tupleProp = ['asdf', 'foo'])).toBeTruthy()
			expect(() => (all.tupleProp = [1, 2])).toThrow()
		})
		test('literal', () => {
			expect(() => (all.literalProp = 'literal')).toBeTruthy()
			expect(() => (all.literalProp = 'anything else')).toThrow()
		})
		test('enom', () => {
			expect(() => (all.enomProp = 'foo')).toBeTruthy()
			expect(() => (all.enomProp = 'anything else')).toThrow()
		})
		test('description', () => {
			expect(() => (all.describeProp = 'string')).toBeTruthy()
			expect(() => (all.describeProp = 3)).toThrow()
		})
	})

	describe('test flag enumeration', () => {
		test('get flag creation', () => {
			const flag1 = getNextFlag()
			const flag2 = getNextFlag()
			expect(flag1).toBeLessThan(flag2)
		})

		test('createType call', () => {
			const func1 = () => true
			const func2 = () => true
			const flag1 = createType(func1)
			const flag2 = createType(func2)
			expect(flag1).toBeLessThan(flag2)
			expect(validatorMap.get(flag1)).toBe(func1)
			expect(validatorMap.get(flag2)).toBe(func2)
		})

		test('without type function', () => {
			expect(() => {
				const isEmail = (str) => {
					const regex =
						/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
					return regex.test(str)
				}

				const Email = createType((str) => isEmail(str))

				Type.Role = {
					name: string,
					access: enom('user', 'admin', 'super'),
				}

				Type.User = {
					name: string,
					email: Email,
					role: Type.Role,
				}
			}).not.toThrow()
		})
	})
})

describe('Type function', () => {
	test('Instantiation with Type()', () => {
		Type.Test1 = {
			isActive: boolean,
		}
		const Test = Type({
			foo: string,
			bar: Type.Test1 | string,
		})

		expect(typeof Test).toBe('bigint')
		expect(typeof Test()).toBe('object')
	})
})
