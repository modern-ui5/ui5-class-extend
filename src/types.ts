import type Event from "sap/ui/base/Event";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type {
  AggregationBindingInfo,
  MetadataOptions,
  PropertyBindingInfo,
} from "sap/ui/base/ManagedObject";
import type RenderManager from "sap/ui/core/RenderManager";

declare const typeTag: unique symbol;

type OmitNever<T> = Omit<
  T,
  { [K in keyof T]: T[K] extends never ? K : never }[keyof T]
>;

type TypeStringToType<
  T extends string,
  F = any
> = typeof typeTag extends keyof T
  ? T[typeof typeTag]
  :
      | (T extends "string"
          ? string
          : T extends "int" | "float"
          ? number
          : T extends "boolean"
          ? boolean
          : T extends "object"
          ? object
          : T extends "function"
          ? Function
          : T extends `${infer U}[]`
          ? Exclude<TypeStringToType<U>, undefined>[]
          : F)
      | undefined;

type MetadataItemToType<T, F = any> = T extends string
  ? TypeStringToType<T, F>
  : "type" extends keyof T
  ? "defaultValue" extends keyof T
    ?
        | Exclude<TypeStringToType<T["type"] & string, F>, undefined>
        | T["defaultValue"]
    : TypeStringToType<T["type"] & string, F>
  : F;

type MetadataItemVisible<T> = "visibility" extends keyof T
  ? T["visibility"] extends "hidden"
    ? false
    : true
  : true;

type PropertiesToMethods<T> = {
  [K in keyof T & string as `get${Capitalize<K>}`]: () => MetadataItemToType<
    T[K]
  >;
} & {
  [K in keyof T & string as `set${Capitalize<K>}`]: (
    value: MetadataItemToType<T[K]>
  ) => void;
};

type SingleAggregationsToMethods<T> = {
  [K in keyof T & string as `get${Capitalize<K>}`]: () => MetadataItemToType<
    T[K],
    ManagedObject
  > | null;
} & {
  [K in keyof T & string as `set${Capitalize<K>}`]: (
    value: MetadataItemToType<T[K], ManagedObject> | null
  ) => void;
} & {
  [K in keyof T & string as `destroy${Capitalize<K>}`]: () => void;
};

type SingularName<N, T> = "singularName" extends keyof T
  ? T["singularName"] & string
  : N;

type MultipleAggregationsToMethods<T> = {
  [K in keyof T & string as `get${Capitalize<K>}`]: () => MetadataItemToType<
    T[K],
    ManagedObject
  >[];
} & {
  [K in keyof T &
    string as `removeAll${Capitalize<K>}`]: () => MetadataItemToType<
    T[K],
    ManagedObject
  >[];
} & {
  [K in keyof T & string as `destroy${Capitalize<K>}`]: () => void;
} & {
  [K in keyof T & string as `add${Capitalize<SingularName<K, T[K]>>}`]: (
    item: MetadataItemToType<T[K], ManagedObject>
  ) => void;
} & {
  [K in keyof T & string as `remove${Capitalize<SingularName<K, T[K]>>}`]: (
    item: number | string | MetadataItemToType<T[K], ManagedObject>
  ) => MetadataItemToType<T[K], ManagedObject> | null;
} & {
  [K in keyof T & string as `insert${Capitalize<SingularName<K, T[K]>>}`]: (
    item: MetadataItemToType<T[K], ManagedObject>,
    index: number
  ) => void;
} & {
  [K in keyof T & string as `indexOf${Capitalize<SingularName<K, T[K]>>}`]: (
    item: MetadataItemToType<T[K], ManagedObject>
  ) => number;
};

type SingleAssociationsToMethods<T> = {
  [K in keyof T & string as `get${Capitalize<K>}`]: () => string | null;
} & {
  [K in keyof T & string as `set${Capitalize<K>}`]: (
    value: string | MetadataItemToType<T[K], ManagedObject> | null
  ) => void;
};

type MultipleAssociationsToMethods<T> = {
  [K in keyof T & string as `get${Capitalize<K>}`]: () => string[];
} & {
  [K in keyof T & string as `removeAll${Capitalize<K>}`]: () => string[];
} & {
  [K in keyof T & string as `add${Capitalize<SingularName<K, T[K]>>}`]: (
    item: string | MetadataItemToType<T[K], ManagedObject>
  ) => void;
} & {
  [K in keyof T & string as `remove${Capitalize<SingularName<K, T[K]>>}`]: (
    item: MetadataItemToType<T[K], ManagedObject>
  ) => number | string | MetadataItemToType<T[K], ManagedObject> | null;
};

type EventParameters<T> = "parameters" extends keyof T
  ? {
      [K in keyof T["parameters"]]: Exclude<
        MetadataItemToType<T["parameters"][K]>,
        undefined
      >;
    }
  : {};

type EventsToMethods<T> = {
  [K in keyof T & string as `attach${Capitalize<K>}`]: {
    (
      data: object,
      handler: (evt: Event<EventParameters<T[K]>>) => void,
      listener?: object
    ): void;
    (
      handler: (evt: Event<EventParameters<T[K]>>) => void,
      listener?: object
    ): void;
  };
} & {
  [K in keyof T & string as `detach${Capitalize<K>}`]: (
    handler: Function,
    listener?: object
  ) => void;
} & {
  [K in keyof T & string as `fire${Capitalize<K>}`]: {
    (
      ...args: {} extends EventParameters<T[K]>
        ? [parameters?: EventParameters<T[K]>]
        : [parameters: EventParameters<T[K]>]
    ): void;
  };
};

type MetadataToInterface<T, M extends MetadataOptions> = PropertiesToMethods<
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
    OmitNever<{
      [K in keyof M["aggregations"]]: MetadataItemVisible<
        M["aggregations"][K]
      > extends false
        ? never
        : M["aggregations"][K] extends MetadataOptions.Aggregation & {
            multiple: false;
          }
        ? M["aggregations"][K]
        : never;
    }>
  > &
  MultipleAggregationsToMethods<
    OmitNever<{
      [K in keyof M["aggregations"]]: MetadataItemVisible<
        M["aggregations"][K]
      > extends false
        ? never
        : M["aggregations"][K] extends MetadataOptions.Aggregation & {
            multiple: false;
          }
        ? never
        : M["aggregations"][K];
    }>
  > &
  SingleAssociationsToMethods<
    OmitNever<{
      [K in keyof M["associations"]]: MetadataItemVisible<
        M["associations"][K]
      > extends false
        ? never
        : M["associations"][K] extends MetadataOptions.Association & {
            multiple: false;
          }
        ? M["associations"][K]
        : never;
    }>
  > &
  MultipleAssociationsToMethods<
    OmitNever<{
      [K in keyof M["associations"]]: MetadataItemVisible<
        M["associations"][K]
      > extends false
        ? never
        : M["associations"][K] extends MetadataOptions.Association & {
            multiple: false;
          }
        ? never
        : M["associations"][K];
    }>
  > &
  EventsToMethods<M["events"]> &
  (T extends new (...args: any) => infer S ? S : {});

type MetadataToSettings<T, M extends MetadataOptions> = Partial<
  // Properties
  OmitNever<{
    [K in keyof M["properties"]]: MetadataItemVisible<
      M["properties"][K]
    > extends false
      ? never
      :
          | MetadataItemToType<M["properties"][K], unknown>
          | PropertyBindingInfo
          | `{${string}}`;
  }> &
    // Aggregations
    OmitNever<{
      [K in keyof M["aggregations"]]: MetadataItemVisible<
        M["aggregations"][K]
      > extends false
        ? never
        : M["aggregations"][K] extends MetadataOptions.Aggregation & {
            multiple: false;
          }
        ? MetadataItemToType<M["aggregations"][K], unknown>
        :
            | MetadataItemToType<M["aggregations"][K], unknown>
            | MetadataItemToType<M["aggregations"][K], unknown>[]
            | AggregationBindingInfo
            | `{${string}}`;
    }> &
    // Associations
    OmitNever<{
      [K in keyof M["associations"]]: MetadataItemVisible<
        M["associations"][K]
      > extends false
        ? never
        : M["associations"][K] extends MetadataOptions.Association & {
            multiple: false;
          }
        ? MetadataItemToType<M["associations"][K], unknown> | string
        : (MetadataItemToType<M["associations"][K], unknown> | string)[];
    }> & {
      // Events
      [K in keyof M["events"]]: (
        evt: Event<EventParameters<M["events"][K]>>
      ) => void;
    }
> &
  (T extends new (id: string, settings: infer S) => any ? S : {});

export function typed<T>(): <const U extends string>(
  value: U
) => U & { [typeTag]: T } {
  return (value) => value as any;
}

export interface Renderer<T = any> {
  apiVersion?: number;
  render(rm: RenderManager, obj: T): void;
  [prop: string | symbol]: any;
}

export interface ClassInfo<M extends MetadataOptions = MetadataOptions> {
  metadata?: M;
  renderer?: string | Renderer["render"] | Renderer;
}

export interface Ui5BaseConstructor<T, M extends MetadataOptions = {}> {
  new (settings?: MetadataToSettings<T, M>): MetadataToInterface<T, M>;
  new (
    //
    id?: string,
    settings?: MetadataToSettings<T, M>
  ): MetadataToInterface<T, M>;
}
