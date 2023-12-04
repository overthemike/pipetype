import { typeDefinitions, createType, validatorMap } from "./definitions"
import { Struct, ProxyTarget, ValidatorFunction } from "./types";

// The Proxy to handle type definitions
export const Type = new Proxy<ProxyTarget>({}, {
  set(target, prop:string, definition) {
    if (prop in target) {
      console.warn(`Type "${String(prop)}" already exists.`);
      return false;
    }
    if (typeof definition === 'object' && definition !== null && !Array.isArray(definition)) {
      const struct:Struct = {};
      for (const [key, flag] of Object.entries(definition)) {
        if (typeof flag === 'function') {
          struct[key] = createType(flag as ValidatorFunction<unknown>);
        } else if (typeof flag === 'bigint') {
          struct[key] = flag;
        } else {
          // Handle the case where flag is neither a function nor a bigint
          throw new Error(`Invalid type for flag '${String(key)}'. Expected a function or bigint.`);
        }
      }
      
      typeDefinitions.set(prop, struct);
      target[prop] = createValidationProxy(struct);
      return true;
    }
    throw new Error(`The definition of type '${String(prop)}' must be an object.`);
  },
  get(target, prop:string) {
    if (prop in target) {
      return target[prop];
    }
    throw new Error(`Type '${String(prop)}' is not defined.`);
  }
});

// The Proxy to handle validation based on flags
export function createValidationProxy(struct: Struct) {
  return new Proxy({}, {
    get(target, prop: string, receiver) {
      if (prop in struct) {
        return Reflect.get(target, prop, receiver);
      }
      const flag = struct[prop];
      if (typeof flag === 'bigint') {  // Ensure that flag is a bigint
        const validator = validatorMap.get(flag);
        if (validator) {
          return validator;
        }
        throw new Error(`No validator found for property '${String(prop)}'`);
      }
      return undefined;
    },
    set(target, prop:string, value) {
      if (prop in struct) {
        const flag = struct[prop];
        if (typeof flag === 'bigint') {  // Ensure that flag is a bigint
          const validator = validatorMap.get(flag);
          if (!validator) {
            throw new Error(`No validator defined for flag '${String(flag)}'`);
          }
          if (!validator(value)) {
            throw new Error(`Validation failed for property '${String(prop)}'.`);
          }
        }
      }
      return Reflect.set(target, prop, value);
    }
  });
}

