import { ValidatorFunction, TypeDefinitionsMap, ValidatorMap, TypeDefinitionArrayWeakSet, StructPropertyArrayMapper } from "./types"

// keeps track of last used bigint
let lastFlag = 1n

// A Validator Map is how we link a bigint value to a validation function
export const validatorMap: ValidatorMap = new Map()

/**
 *  The type definition map stores type properties and *evaluated* bigints or a validation function
 *  An *evaluated* bigint can be a union of multiple types merged together via bitwise OR operation
 *  This gives us all the info we need to find all of the different union types to validate in a single
 *  bigint. 
 *  For Example: (though implemented more simply)
 * 
 *  const string  = 0b001n
 *  const number  = 0b010n
 *  const boolean = 0b100n
 *  ...etc
 * 
 *  Type.User = {
 *    id: string | number  <- this will evaluate to 3n
 *  }
 * 
 *  We can then use these numbers to know exactly which validation functions to run as each bigint
 *  is mapped to a single validation function. 3n === 0b011 - a flag for both string and number but
 *  not for boolean. This is what allows for union types.
 * 
 *  If a function is passed in instead, we will store a new ValidatorFunction in the ValidatorMap 
 *  with a new bigint value associated with it and then store the bigint value in this map
 */
export const typeDefinitions: TypeDefinitionsMap = new Map()

// Left shift to create the next avaialble bit for our new type
function getNextFlag(): bigint {
  lastFlag = lastFlag << 1n
  return lastFlag
}

export const typeArrays: TypeDefinitionArrayWeakSet = new WeakSet()

export function createType<T>(validator: ValidatorFunction<T>): bigint {
  const newFlag = getNextFlag()
  validatorMap.set(newFlag, validator as ValidatorFunction<unknown>)
  return newFlag
}

export const any = createType<any>(() => true)
export const unknown = createType<unknown>(() => true)
export const string = createType<string>((value) => typeof value === 'string')
export const number = createType<number>((value) => typeof value === 'number')
export const boolean = createType<boolean>((value) => typeof value === 'boolean')
export const bigint = createType<bigint>((value) => typeof value === 'bigint')
export const symbol = createType<symbol>((value) => typeof value === 'symbol')
export const nil = createType<null>((value) => value === null)
export const undef = createType<undefined>((value) => value === undefined)
export const nullish = createType<null | undefined>((value) => value === undefined || value === null)
export const date = createType<Date>((value) => Object.prototype.toString.call(value) === '[object Date]')

export const array = new Proxy({}, {
  get(target, prop:bigint, definition): bigint {
    if (typeof(prop) !== 'bigint') {
      throw new Error('array must have a valid type')
    }
    const structPropertyObj:StructPropertyArrayMapper = {
      
    }
  }
})
