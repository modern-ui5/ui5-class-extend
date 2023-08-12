import "@wdio/globals/types";
import "./loadUi5.js";
import { expect } from "@wdio/globals";
import { Ui5Base, ui5Extend } from "./dist/main.js";
import VBox from "sap/m/VBox";
import Text from "sap/m/Text";

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
      init(): void {
        super.init();

        this.addItem(
          new Text(this.getId() + "-text", {
            text: this.getText(),
          })
        );
      }

      // @ts-ignore
      setText(value: string): this {
        (this.getItems()[0] as Text).setText(value);
        return this.setProperty("text", value);
      }
    }

    const vbox = new MyVBox("myvbox", {
      text: "Hello World",
    }).placeAt(document.body);

    expect(vbox.getText()).toBe("Hello World");
    expect(await browser.$("#myvbox-text").getText()).toBe("Hello World");
  });
});
