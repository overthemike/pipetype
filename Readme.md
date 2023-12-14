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

// Define a custom email type
const Email = createType((str) => isEmail(str))

// Define a user schema
Type.User = {
	id: string | number, // example of a union
	name: string,
	email: Email, // type created above
	age: number,
	isActive: boolean,
}

// Create a user object
const user = Type.User()
user.name = 'John Doe'
user.email = 'john.doe@example.com'
user.age = 30
user.isActive = 'true' // throws an error
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
