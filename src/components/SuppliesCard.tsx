import type { Supply } from "../types";

type Props = {
  supplies: Supply[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: "name" | "quantity" | "code", value: string) => void;
};

export function SuppliesCard({ supplies, onAdd, onRemove, onUpdate }: Props) {
  return (
    <section className="card">
      <h2>Supplies Used (Real-Time)</h2>
      <p className="muted">
        Log supplies as they're used during the procedure. Cost is added later during billing/coding, not here.
      </p>

      {supplies.map((supply) => (
        <div className="supply-row" key={supply.id}>
          <input
            placeholder="Supply Name"
            value={supply.name}
            onChange={(e) => onUpdate(supply.id, "name", e.target.value)}
          />
          <input
            placeholder="Quantity"
            value={supply.quantity}
            onChange={(e) => onUpdate(supply.id, "quantity", e.target.value)}
          />
          <input
            placeholder="Supply / HCPCS Code"
            value={supply.code}
            onChange={(e) => onUpdate(supply.id, "code", e.target.value)}
          />
          <button type="button" onClick={() => onRemove(supply.id)}>
            Remove
          </button>
        </div>
      ))}

      <button type="button" onClick={onAdd}>
        Add Supply
      </button>
    </section>
  );
}
