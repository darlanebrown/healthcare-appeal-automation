import type { Supply } from "../types";

export function createEmptySupply(): Supply {
  return {
    id: crypto.randomUUID(),
    name: "",
    quantity: "",
    code: "",
  };
}

export function addSupply(supplies: Supply[]): Supply[] {
  return [...supplies, createEmptySupply()];
}

export function removeSupply(supplies: Supply[], id: string): Supply[] {
  return supplies.filter((supply) => supply.id !== id);
}

export function updateSupplyField(
  supplies: Supply[],
  id: string,
  field: keyof Omit<Supply, "id">,
  value: string,
): Supply[] {
  return supplies.map((supply) =>
    supply.id === id ? { ...supply, [field]: value } : supply,
  );
}
