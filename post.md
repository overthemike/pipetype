# Let's do an experiment

Typescript is great, but it's limited to what to the data that we control in our applications. No runtime type checking. We have fantastic libraries that help with this (read: zod), but wouldn't it be great if it just worked on it's own? There's a stage 1 proposal for javascript to allow for type _comments_, but the only thing that does for us is allow us to skip a compile step. Wooptie doo. The type comments will just be ignored. JavaScript is fairly unique in the fact that it's always been backwards compatible so that older sites still work. Without, admitedly, having read too much into the propsosal, I'm assuming this is a huge factor as to why they want to introduce type comments, but leave actual types on the shoreline. Regardless, I'm left wanting.

When I learned about type comments, I was somewhat disappointed. Then I started thinking. With all these new features js has been given over the past decade, maybe we can fake it?

### The idea

When I first started using typescript, the first thing I noticed that stuck out to me were the union operators (`|` and `&`). In Javascript, these are bitwise operators. They perform bitwise operations on numbers. If you pay close attention, those operators are doing the same things to types as the operators in javascript do to numbers.

> You'll need to be familiar with bitwise operations for this next part

```typescript
type User = {
    id: number | string, // <- Let's talk about this
    username: string,
    password: string,
    ...etc
}
```

When you use the "union" operator, what you're conceptually doing is treating the types as binary numbers and performing a bitwise OR opertion on them. To see this, let's create our own 'types' that are really just binary numbers. We can worry about the rest later.

```javascript
// this is js
const number = 0b00001
const string = 0b00010

const id = number | string
```

The `id` variable is now set to `0b00011`. Not very exciting until you realize that that binary number just told us the two differnt types that `id` is allowed to be.

## Problems

Let's try and figure out some hurdles we're going to run into along the way and see if we can figure out some solutions for them.

#### Problem

Number types only allow up to 32 bits. This will be a hinderance if you have more than 32 types.

#### Solution

bigints coming in the save! We can use as many bits as we need using a bigint.

```javascript
// instead of
const number = 0b00001
const string = 0b00010

// we can use
const number = 0b00001n
const string = 0b00010n
// and we shouldn't run out of bits unless we run out of memory
```

<br />

#### Problem

The intersection `&` operator and the javascript bitwise `&` operator don't quite work the same way. An intersection of multiple types will have every property from each type associated with it, while the bitwise `&` will only return a 1 in it's place if both operands and present.

#### Solution

None yet.

<br />
