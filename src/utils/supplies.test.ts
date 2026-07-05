import { describe, expect, it } from "vitest";
import {
  addSupply,
  createEmptySupply,
  removeSupply,
  updateSupplyField,
} from "./supplies";
import type { Supply } from "../types";

describe("createEmptySupply", () => {
  it("returns a supply with a unique id and empty name/quantity/code", () => {
    const supply = createEmptySupply();

    expect(typeof supply.id).toBe("string");
    expect(supply.id.length).toBeGreaterThan(0);
    expect(supply.name).toBe("");
    expect(supply.quantity).toBe("");
    expect(supply.code).toBe("");
  });

  it("generates a different id on each call", () => {
    expect(createEmptySupply().id).not.toBe(createEmptySupply().id);
  });
});

describe("addSupply", () => {
  it("appends one new empty supply and keeps existing entries unchanged", () => {
    const existing: Supply[] = [{ id: "1", name: "Splint", quantity: "1", code: "A123" }];
    const result = addSupply(existing);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(existing[0]);
    expect(result[1]).toEqual({ id: result[1].id, name: "", quantity: "", code: "" });
  });
});

describe("removeSupply", () => {
  it("removes only the supply matching the given id", () => {
    const supplies: Supply[] = [
      { id: "1", name: "Splint", quantity: "1", code: "A123" },
      { id: "2", name: "Brace", quantity: "2", code: "B456" },
    ];

    const result = removeSupply(supplies, "1");

    expect(result).toEqual([{ id: "2", name: "Brace", quantity: "2", code: "B456" }]);
  });
});

describe("updateSupplyField", () => {
  it("updates only the specified field on the matching supply", () => {
    const supplies: Supply[] = [
      { id: "1", name: "Splint", quantity: "1", code: "A123" },
      { id: "2", name: "Brace", quantity: "2", code: "B456" },
    ];

    const result = updateSupplyField(supplies, "1", "quantity", "3");

    expect(result).toEqual([
      { id: "1", name: "Splint", quantity: "3", code: "A123" },
      { id: "2", name: "Brace", quantity: "2", code: "B456" },
    ]);
  });
});
