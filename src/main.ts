import type { MetadataOptions } from "sap/ui/base/ManagedObject";
import type { ClassInfo, Ui5BaseConstructor } from "./types.js";

export * from "./types.js";

const classInfoSym = Symbol("classInfo");

export function Ui5Base<T extends new (...args: any) => any>(
  baseClass: T
): Ui5BaseConstructor<T>;
export function Ui5Base<
  T extends new (...args: any) => any,
  const M extends MetadataOptions
>(baseClass: T, classInfo: ClassInfo<M>): Ui5BaseConstructor<T, M>;
export function Ui5Base<
  T extends new (...args: any) => any,
  const M extends MetadataOptions
>(baseClass: T, classInfo?: ClassInfo<M>): Ui5BaseConstructor<T, M> {
  return class extends baseClass {
    static [classInfoSym] = {
      baseClass,
      classInfo,
    };
  };
}

export function ui5Extend(name?: string) {
  return <T extends new (...args: any) => any>(mockClass: T, _?: any): T => {
    if (!(classInfoSym in mockClass) || mockClass[classInfoSym] == null) {
      throw new TypeError("Class must extend from Ui5Base");
    }

    const { baseClass, classInfo } = mockClass[classInfoSym] as {
      baseClass: any;
      classInfo: ClassInfo;
    };

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
        classInfo,
        ...Object.getOwnPropertyNames(mockClass.prototype).map((name) =>
          name === "constructor" || name === "init"
            ? {}
            : { [name]: mockClass.prototype[name] }
        ),
        {
          init: function (this: any) {
            for (const sym of Object.getOwnPropertySymbols(
              mockClass.prototype
            )) {
              this[sym] = mockClass.prototype[sym];
            }

            mockClass.prototype.init.call(this);
          },
        }
      )
    );

    return result;
  };
}
