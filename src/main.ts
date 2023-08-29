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
>(baseClass: T, classInfo: ClassInfo<M> = {}): Ui5BaseConstructor<T, M> {
  return class extends baseClass {
    static [classInfoSym] = {
      baseClass,
      classInfo,
    };
  } as any;
}

export function ui5Extend(name?: string) {
  return <T extends new () => any>(mockClass: T, _?: any): T => {
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

    const prototypeSymbols = Object.getOwnPropertySymbols(mockClass.prototype);

    const result = baseClass.extend(
      name ?? `${mockClass.name}-${Math.random().toString().slice(2)}`,
      Object.assign(
        classInfo,
        ...Object.getOwnPropertyNames(mockClass.prototype).map((name) =>
          name === "constructor" ? {} : { [name]: mockClass.prototype[name] }
        ),
        {
          constructor: function (...args: any) {
            delete mockClass.prototype.init;

            const instance = new mockClass();
            delete instance.init;

            Object.assign(this, instance);
            instance.destroy();

            for (const sym of prototypeSymbols) {
              this[sym] = mockClass.prototype[sym];
            }

            baseClass.apply(this, args);
          },
        }
      )
    );

    Object.assign(
      result,
      ...Object.getOwnPropertyNames(mockClass).map((name) =>
        ["name", "length", "prototype"].includes(name)
          ? {}
          : { [name]: mockClass[name as keyof typeof mockClass] }
      ),
      ...Object.getOwnPropertySymbols(mockClass).map((sym) =>
        sym === classInfoSym
          ? {}
          : { [sym]: mockClass[sym as keyof typeof mockClass] }
      )
    );

    return result;
  };
}
