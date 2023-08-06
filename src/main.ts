import Button from "sap/m/Button";
import Event from "sap/ui/base/Event";
import ManagedObject, { MetadataOptions } from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";

declare const typeTag: unique symbol;

type OmitNever<T> = Omit<
  T,
  { [K in keyof T]: T[K] extends never ? K : never }[keyof T]
>;

type TypeStringToType<T extends string, F = any> = T extends "string"
  ? string
  : T extends "int" | "float"
  ? number
  : T extends "object"
  ? object
  : T extends "function"
  ? Function
  : T extends `${infer U}[]`
  ? TypeStringToType<U>[]
  : F;

type MetadataItemToType<T, F = any> = typeof typeTag extends keyof T
  ? T[typeof typeTag]
  : TypeStringToType<
      T extends string
        ? T
        : "type" extends keyof T
        ? T["type"] & string
        : "any",
      F
    >;

type MetadataItemVisible<T> = "visibility" extends keyof T
  ? T["visibility"] extends "hidden"
    ? false
    : true
  : true;

type PropertiesToMethods<This, T> = {
  [K in keyof T & string as `get${Capitalize<K>}`]: (
    this: This
  ) => MetadataItemToType<T[K]>;
} & {
  [K in keyof T & string as `set${Capitalize<K>}`]: (
    this: This,
    value: MetadataItemToType<T[K]>
  ) => This;
};

type SingleAggregationsToMethods<This, T> = {
  [K in keyof T & string as `get${Capitalize<K>}`]: (
    this: This
  ) => MetadataItemToType<T[K], ManagedObject> | null;
} & {
  [K in keyof T & string as `set${Capitalize<K>}`]: (
    this: This,
    value: MetadataItemToType<T[K], ManagedObject> | null
  ) => This;
} & {
  [K in keyof T & string as `destroy${Capitalize<K>}`]: (this: This) => This;
};

type SingularName<N, T> = "singularName" extends keyof T
  ? T["singularName"] & string
  : N;

type MultipleAggregationsToMethods<This, T> = {
  [K in keyof T & string as `get${Capitalize<K>}`]: (
    this: This
  ) => MetadataItemToType<T[K], ManagedObject>[];
} & {
  [K in keyof T & string as `removeAll${Capitalize<K>}`]: (
    this: This
  ) => MetadataItemToType<T[K], ManagedObject>[];
} & {
  [K in keyof T & string as `destroy${Capitalize<K>}`]: (this: This) => This;
} & {
  [K in keyof T & string as `add${Capitalize<SingularName<K, T[K]>>}`]: (
    this: This,
    item: MetadataItemToType<T[K], ManagedObject>
  ) => This;
} & {
  [K in keyof T & string as `remove${Capitalize<SingularName<K, T[K]>>}`]: (
    this: This,
    item: number | string | MetadataItemToType<T[K], ManagedObject>
  ) => MetadataItemToType<T[K], ManagedObject> | null;
} & {
  [K in keyof T & string as `insert${Capitalize<SingularName<K, T[K]>>}`]: (
    this: This,
    item: MetadataItemToType<T[K], ManagedObject>,
    index: number
  ) => This;
} & {
  [K in keyof T & string as `indexOf${Capitalize<SingularName<K, T[K]>>}`]: (
    this: This,
    item: MetadataItemToType<T[K], ManagedObject>
  ) => number;
};

type SingleAssociationsToMethods<This, T> = {
  [K in keyof T & string as `get${Capitalize<K>}`]: (
    this: This
  ) => string | null;
} & {
  [K in keyof T & string as `set${Capitalize<K>}`]: (
    this: This,
    value: string | MetadataItemToType<T[K], ManagedObject> | null
  ) => This;
};

type MultipleAssociationsToMethods<This, T> = {
  [K in keyof T & string as `get${Capitalize<K>}`]: (this: This) => string[];
} & {
  [K in keyof T & string as `removeAll${Capitalize<K>}`]: (
    this: This
  ) => string[];
} & {
  [K in keyof T & string as `add${Capitalize<SingularName<K, T[K]>>}`]: (
    this: This,
    item: string | MetadataItemToType<T[K], ManagedObject>
  ) => This;
} & {
  [K in keyof T & string as `remove${Capitalize<SingularName<K, T[K]>>}`]: (
    this: This,
    item: MetadataItemToType<T[K], ManagedObject>
  ) => number | string | MetadataItemToType<T[K], ManagedObject> | null;
};

type EventsToMethods<This, T> = {
  [K in keyof T & string as `attach${Capitalize<K>}`]: {
    (
      this: This,
      data: object,
      handler: (evt: Event) => void,
      listener?: object
    ): This;
    (this: This, handler: (evt: Event) => void, listener?: object): This;
  };
} & {
  [K in keyof T & string as `detach${Capitalize<K>}`]: (
    this: This,
    handler: Function,
    listener?: object
  ) => This;
} & {
  [K in keyof T & string as `fire${Capitalize<K>}`]: {
    (this: This, parameters?: object): This;
  };
};

type MetadataToInterface<This, M extends MetadataOptions> = PropertiesToMethods<
  This,
  OmitNever<{
    [K in keyof M["properties"]]: MetadataItemVisible<
      M["properties"][K]
    > extends false
      ? never
      : M["properties"][K] extends MetadataOptions.Property
      ? M["properties"][K]
      : M["properties"][K];
  }>
> &
  SingleAggregationsToMethods<
    This,
    OmitNever<{
      [K in keyof M["aggregations"]]: MetadataItemVisible<
        M["aggregations"][K]
      > extends false
        ? never
        : M["aggregations"][K] extends MetadataOptions.Aggregation
        ? M["aggregations"][K]["multiple"] extends false
          ? M["aggregations"][K]
          : never
        : never;
    }>
  > &
  MultipleAggregationsToMethods<
    This,
    OmitNever<{
      [K in keyof M["aggregations"]]: MetadataItemVisible<
        M["aggregations"][K]
      > extends false
        ? never
        : M["aggregations"][K] extends MetadataOptions.Aggregation
        ? M["aggregations"][K]["multiple"] extends false
          ? never
          : M["aggregations"][K]
        : M["aggregations"][K];
    }>
  > &
  SingleAssociationsToMethods<
    This,
    OmitNever<{
      [K in keyof M["associations"]]: MetadataItemVisible<
        M["associations"][K]
      > extends false
        ? never
        : M["associations"][K] extends MetadataOptions.Association
        ? M["associations"][K]["multiple"] extends false
          ? M["associations"][K]
          : never
        : never;
    }>
  > &
  MultipleAssociationsToMethods<
    This,
    OmitNever<{
      [K in keyof M["associations"]]: MetadataItemVisible<
        M["associations"][K]
      > extends false
        ? never
        : M["associations"][K] extends MetadataOptions.Association
        ? M["associations"][K]["multiple"] extends false
          ? never
          : M["associations"][K]
        : M["associations"][K];
    }>
  > &
  EventsToMethods<This, M["events"]>;

export function typed<T>(): <const U>(value: U) => U & { [typeTag]: T } {
  return (value) => value as any;
}

export function createBaseClass<
  T extends new (...args: any) => any,
  const M extends MetadataOptions
>(base: T, metadata: M): <This>() => new () => MetadataToInterface<This, M> {
  return () => base as any;
}

const ControlBase = createBaseClass(Control, {
  properties: {
    text: typed<"on" | "off">()({
      type: "string",
    }),
  },
  aggregations: {
    button: {
      multiple: false,
    },
    items: {
      singularName: "item",
    },
  },
  associations: {
    selectedItems: {
      singularName: "selectedItem",
    },
  },
});

class TestClass extends ControlBase<TestClass>() {
  constructor() {
    super();

    this.setText("on");
  }
}
