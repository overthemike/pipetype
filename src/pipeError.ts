export default class PipeError extends Error {
	constructor(message: string, public quiet: boolean) {
		super(message)

		Object.setPrototypeOf(this, PipeError.prototype)
	}
}
