import "@wdio/globals/types";
import "./loadUi5.js";
import { expect } from "@wdio/globals";
import { Ui5Base, ui5Extend } from "./dist/main.js";
import VBox from "sap/m/VBox";
import Text from "sap/m/Text";
import Button from "sap/m/Button";

describe("ui5-class-extend", () => {
  it("should extend with more properties", async () => {
    @ui5Extend()
    class MyVBox extends Ui5Base(VBox, {
      metadata: {
        properties: {
          text: {
            type: "string",
            defaultValue: "",
          },
        },
      },
      renderer: "sap.m.VBoxRenderer",
    }) {
      someProperty: string = "Hi";

      init(): void {
        super.init();

        this.addItem(
          new Text(this.getId() + "-text", {
            text: this.getText(),
          })
        );
      }

      setText = function (this: MyVBox, value: string): MyVBox {
        (this.getItems()[0] as Text).setText(value);
        return this.setProperty("text", value);
      };
    }

    const vbox = new MyVBox("myvbox", {
      text: "Hello World",
    }).placeAt(document.body);

    expect(vbox.someProperty).toBe("Hi");
    expect(vbox.getText()).toBe("Hello World");
    expect(await browser.$("#myvbox-text").getText()).toBe("Hello World");

    vbox.destroy();
  });

  it("should extend with more events", async () => {
    @ui5Extend()
    class MyVBox extends Ui5Base(VBox, {
      metadata: {
        events: {
          buttonPress: {
            parameters: {
              timestamp: "int",
            },
          },
        },
      },
      renderer: "sap.m.VBoxRenderer",
    }) {
      someProperty: string = "Hi";

      init(): void {
        super.init();

        this.addItem(
          new Button(this.getId() + "-button", {
            press: () => {
              this.fireButtonPress({
                timestamp: Date.now(),
              });
            },
          })
        );
      }
    }

    let fired = false;
    let timestamp!: number;

    const vbox = new MyVBox("myvbox", {
      buttonPress: (evt) => {
        timestamp = evt.getParameter("timestamp");
        fired = true;
      },
    }).placeAt(document.body);

    await browser.$("#myvbox-button").click();
    expect(fired).toBeTruthy();
    expect(timestamp).not.toBe(undefined);

    vbox.destroy();
  });

  it("should fail if class contains accessors/setters", async () => {
    expect(() => {
      @ui5Extend()
      class MyVBox extends Ui5Base(VBox, {
        metadata: {
          properties: {
            text: {
              type: "string",
              defaultValue: "",
            },
          },
        },
        renderer: "sap.m.VBoxRenderer",
      }) {
        get text(): string {
          return this.getText();
        }
      }
    }).toThrowError(TypeError);
  });
});
