# Testing

## Rendering

We use two different rendering engines for testing:

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro): the **preferred way** to test React components,
  but it could be inconvenient to test the engine components' props.
- [React Test Renderer](https://legacy.reactjs.org/docs/test-renderer.html): an official (but still experimental) React library for testing.
  It supports a more direct way to test the components' props, while some features may not be available yet (e.g., createPortal).

## Querying

Please refer to [React Test Renderer API](https://legacy.reactjs.org/docs/test-renderer.html#testrendereract) for more details.

About RTL, we provide our own wrapper classes for the `render` function to make it easier to select the components in an efficient and readable way.

Instead of using directly RTL APIs:

```typescript
import { render } from "@testing-library/react";

const { container } = render(<CalloutTpl />);

expect(getAllByDataRole(container, `${baseClass}-body`)).toHaveLength(1);
```

We can use the `render` function from `test-utils` file to select the components by data-role attribute in chainable way:

```typescript
import { render } from "test-utils";

expect(render(<CalloutTpl />).getAllByDataRole(`${baseClass}-body`)).toHaveLength(1);
```

Please refer to `test-utils` file for more details.

To using `data-role` attribute to select the components easily, we built `DataRoles` object to retrieve them type safely as well as avoid hard-coded strings and duplications.

```typescript
import { DataRoles } from "test-utils";

console.log(DataRoles.Table); // table;
console.log(DataRoles.Table.Body); // table-body;
console.log(DataRoles.Table.Body.Cell); // table-body-cell;

// Usage
const actualButton = wrapper.getAllByDataRole(DataRoles.Button);
```

## Assertions/Matchers

Although some below recommendations will be linted by ESLint soon, we still want to make sure that the test cases are written in the right way.

Prefer supporting matchers from [Jest](https://jestjs.io/docs/en/expect), [Jest Extended](https://jest-extended.jestcommunity.dev/docs) and
[Jest DOM](https://github.com/testing-library/jest-dom) instead of verbose versions:

```typescript
// Not recommended
expect(array.length).toEqual(3);
expect(emptyArray).toHaveLength(0);

expect(spy.mock.calls).toHaveLength(1);

expect(button.getAttribute("disabled")).toBe(true);
expect(div.classList.contains("button--primary")).toEqual(true);

// Recommended
expect(array).toHaveLength(3);
expect(emptyArray).toBeEmpty();

expect(spy).toHaveBeenCalledOnce();

expect(button).toBeDisabled();
expect(div).toHaveClass(`button--primary`);
```
