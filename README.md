# pipetype

pipetype is an experimental dynamic type validation and schema definition library for JavaScript and TypeScript, designed to provide a flexible and intuitive API for defining and validating data structures.

## Read me first

This is an experiment that is still very much under development. I _do not_ recommend you use this library in any kind of production environment any time soon. There may be performance issues and the api is likely to change.

## Features

- Dynamic Type Validation: Validate data structures at runtime with ease.
- Schema Definitions: Define complex data structures using simple and readable syntax.
- Custom Types: Create custom validation functions to handle unique data types.
- Nested Structures: Support for deeply nested data validation.
- Readonly Properties: Mark properties as readonly to prevent modifications after initialization.
- Supports union types using the same syntax we all love with Typescript

## Installation

```bash
npm install pipetype
```

## Usage

### Basic Example

Here's a quick example to get you started:

```javascript
import Type, { string, number, boolean, createType } from 'pipetype'

// Define a validation function for your type (optional)
// You can also do this directly in the createType callback
const isEmail = (str) => {
	const regex =
		/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
	return regex.test(str)
}

// Define a custom type function to verify the value for whatever is being set to the type
const Email = Type((str) => isEmail(str))

// Define a user schema
const User = Type({
	id: string | number, // example of a union
	name: string,
	email: Email, // type created above
	age: number,
	isActive: boolean,
})

// optional properties can be created by appending "?" at the end of a property string
// or by using optional_{property name}
const Profile = Type({
	id: string | number,
	user: User, // can use a schema as a type to verify that the property follows the rules of the type used to create it
	'address?': string,
	optional_address2: string
})

// readonly properties can be created by appending "*" at the end of a property string
// or by using readonl_{property name}
const Role = Type({
	id: string | number,
	'name*': string,
	readonly_name: string
})
```

### Advanced and Planned Future Usage

For more complex schemas and custom validations as well as forward plans for the defvelopment of this library, refer to the [Advanced Usage section](./Advanced.md).

### API Reference

A detailed [API reference can be found here.](./API.md)

### The Why and How

If you want to know more about the inspriation behind this library and the ideas that
brought it be, [read here](./Summary.md).

### Contributing

Contributions are welcome!

### License

pipetype is MIT licensed.
