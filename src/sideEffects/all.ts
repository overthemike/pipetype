import * as definitions from '../definitions'
import { Type } from '../pipe'

Object.entries(definitions).forEach(([key, value]) => {
	;(globalThis as any)[key] = value
})
;(globalThis as any).Type = Type

export default Type
