# Tests

You can run the tests with `npm run test`.

This will start a server inside the test runner, in order to gather code coverage.

The tests will automatially run in watch mode, along with the server and MCP inspector, when running `npm run dev`.

## Code coverage

The tests will fail if coverage of unignored lines is below 100%: this is to ensure that we explicitly exclude any lines from coverage if it's too complex/not necessary to test them.

This can be done with a block like:

```js
/* node:coverage disable */
const message = "these lines will be excluded from coverage reporting";
console.log(message);
/* node:coverage enable */
```

Or for a specified number of lines:

```js
/* node:coverage ignore next */
console.log("this line will be excluded from coverage reporting");

/* node:coverage ignore next 2 */
const message = "these lines will be excluded from coverage reporting";
console.log(message);
```
