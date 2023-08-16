# UI5 Class Extend

[![API Reference](https://img.shields.io/badge/api-reference-blue?logo=typescript&logoColor=white)](https://modern-ui5.github.io/ui5-class-extend/modules.html)

Type-safe way to write UI5 classes using modern JavaScript classes.

## Installation

Use npm to install:

```
npm install ui5-class-extend
```

Please note that this library works with TypeScript v5.0 or higher and depends
on the [official ESM-style UI5 types](https://sap.github.io/ui5-typescript/)
`@openui5/types` or `@sapui5/types` which will not be automatically installed.

Furthermore, a code transformation is needed to transform UI5-style ESM imports
into valid UI5 code, e.g. with Babel and either
[babel-plugin-ui5-esm](https://github.com/modern-ui5/babel-plugin-ui5-esm) or
[babel-plugin-transform-modules-ui5](https://github.com/ui5-community/babel-plugin-transform-modules-ui5/tree/main).

## Why not use `@ui5/ts-interface-generator`?

The tool
[`@ui5/ts-interface-generator`](https://github.com/SAP/ui5-typescript/tree/main/packages/ts-interface-generator)
works by generating TypeScript code that add the automatically generated method
signatures by means of interface merging, adding an additional preprocessing
step before compiling. Also a one-time manual step is required to fix the
constructor signature.

In contrast, this library aims to provide the automatically generated method and
constructor signatures directly at compile time without any additional steps.

## Usage

### Extending a Class

Use the `ui5Extend` decorator factory and `Ui5Base` to extend from an UI5 class:

```ts
import Control from "sap/ui/Control";
import { Ui5Base, ui5Extend } from "ui5-class-extend";

@ui5Extend()
class MyControl extends Ui5Base(Control) {
  init() {
    super.init();

    console.log("My Control!");
  }
}

const control = new MyControl("mycontrolid");
// My Control!
```

You can optionally pass a fully qualified UI5 name as argument to `ui5Extend`:

```ts
@ui5Extend("my.controls.MyControl")
class MyControl extends Ui5Base(Control) {
  // ...
}
```

If you're not able to use decorators, you can also use `ui5Extend()` as a
function:

```ts
const MyControl = ui5Extend("my.controls.MyControl")(
  class MyControl extends Ui5Base(Control) {
    // ...
  }
);
```

### Providing Metadata

You can define extra control metadata, such as properties or events as argument
to `Ui5Base`. The method signatures for the UI5-generated methods based on the
metdata will automatically be provided by TypeScript.

```ts
import Control from "sap/ui/Control";
import { Ui5Base, ui5Extend } from "ui5-class-extend";

@ui5Extend()
class MyControl extends Ui5Base(Control, {
  metadata: {
    properties: {
      text: {
        type: "string",
        defaultValue: "",
      },
    },
  },
}) {
  init() {
    super.init();

    console.log(`My Control with text '${this.getText()}'!`);
  }
}

const control = new MyControl("mycontrolid", {
  text: "Hello World!",
});
// My Control with text 'Hello World!'
```

### Overriding Automatically Generated Methods

Due to a TypeScript limitation, to override automatically generated methods you
need to use the property initialization syntax.

```ts
import Control from "sap/ui/Control";
import { Ui5Base, ui5Extend } from "ui5-class-extend";

@ui5Extend()
class MyControl extends Ui5Base(Control, {
  metadata: {
    properties: {
      text: {
        type: "string",
        defaultValue: "",
      },
    },
  },
}) {
  init() {
    super.init();

    console.log("My Control!");
  }

  setText = function (this: MyControl, value: string): MyControl {
    //    ^ Use property initialization syntax
    console.log(`Setting text '${value}'`);

    return this.setProperty("text", value);
  };
}

const control = new MyControl("mycontrolid", {
  text: "Hello World!",
});
// My Control!
// Setting text 'Hello World!'
```

To override methods from the base class, you can use the usual syntax.

### Overriding Types

The type system of UI5 is very limited. You can overwrite any types with a more
appropriate TypeScript type using the `typed<T>` function.

```ts
import Control from "sap/ui/Control";
import { Ui5Base, ui5Extend, typed } from "ui5-class-extend";

@ui5Extend()
class MyControl extends Ui5Base(Control, {
  metadata: {
    properties: {
      text: {
        //                                 v UI5 type
        type: typed<"hello" | "goodbye">()("string"),
        //          ^ TypeScript type   ^ Due to TypeScript limitation this
        //            as generic          unusual syntax is required
        defaultValue: "hello",
      },
    },
  },
}) {
  init() {
    super.init();

    console.log(this.getText());
  }
}

const control = new MyControl("mycontrolid", {
  text: "nice to meet you",
  //    ^ This will result in a type error since text can only be "hello"
  //      or "goodbye"
});
```

### Providing a Renderer

You can use the `Renderer` interface to define your renderer. Then specify the
renderer as argument to `Ui5Base`. Due to a TypeScript limitation, you need to
cast your renderer into a generic renderer to prevent cyclic type references:

```ts
import Control from "sap/ui/Control";
import { Ui5Base, ui5Extend, Renderer } from "ui5-class-extend";

const MyControlRenderer: Renderer<MyControl> = {
  apiVersion: 2,

  render(rm, control) {
    // (rm: RenderManager, control: MyControl) => void
    // ...
  },
};

@ui5Extend()
class MyControl extends Ui5Base(Control, {
  metadata: {
    properties: {
      text: {
        type: "string",
        defaultValue: "",
      },
    },
  },
  renderer: MyControlRenderer as Renderer,
  //                          ^ This cast is necessary
}) {
  // ...
}
```

### Caveats

- #### Constructors are not supported

  If you specify a constructor, everything aside property initializations will
  be ignored. Instead you can use the `init()` method to perform
  initializations.

- #### Accessing `this` during property initializations is not supported

  During property initializations `this` refers to a foreign object, therefore
  might result in unexpected behavior when accessed or modified.

  When assigning a bound function to a property, the function body can refer to
  `this` again (see also
  [Overriding Automatically Generated Methods](#overriding-automatically-generated-methods)).

- #### Accessors and setters are not supported

  A `TypeError` will be thrown if you define accessors or setters in your class.
  You can define a getter/setter method instead.

- #### Generated method signatures don't return `this`

  In UI5, a lot of setter methods return `this` to enable method chaining,
  however due to a TypeScript limitation, this library will generate methods
  that return `void` instead of `this`.
