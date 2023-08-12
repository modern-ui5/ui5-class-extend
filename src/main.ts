import type { MetadataOptions } from "sap/ui/base/ManagedObject";
import type {
  ClassInfo,
  MetadataToInterface,
  MetadataToSettings,
} from "./types.js";

export * from "./types.js";

let tempClassInfo: ClassInfo = {};

export function Ui5Base<
  T extends new (...args: any) => any,
  const M extends MetadataOptions
>(
  base: T,
  classInfo: ClassInfo<M>
): {
  new (settings?: MetadataToSettings<T, M>): InstanceType<T> &
    MetadataToInterface<M>;
  new (id?: string, settings?: MetadataToSettings<T, M>): InstanceType<T> &
    MetadataToInterface<M>;
} {
  tempClassInfo = classInfo;
  return base as any;
}

export function ui5Extend(name?: string) {
  return (mockClass: new (...args: any) => any, _?: any) => {
    const baseClass = Object.getPrototypeOf(mockClass);

    if (
      Object.values(Object.getOwnPropertyDescriptors(mockClass.prototype)).find(
        (descriptor) => descriptor.get != null || descriptor.set != null
      ) != null
    ) {
      throw new TypeError("Class prototype should not contain accessors");
    }

    const result = baseClass.extend(
      name ?? `${mockClass.name}-${Math.random().toString().slice(2)}`,
      Object.assign(
        {
          constructor(this: any) {
            for (const sym of Object.getOwnPropertySymbols(
              mockClass.prototype
            )) {
              this[sym] = mockClass.prototype[sym];
            }

            const instance = new mockClass();
            Object.assign(this, instance);
          },
        },
        tempClassInfo,
        ...Object.getOwnPropertyNames(mockClass.prototype).map((name) =>
          name === "constructor" ? {} : { [name]: mockClass.prototype[name] }
        )
      )
    );

    tempClassInfo = {};
    return result;
  };
}
