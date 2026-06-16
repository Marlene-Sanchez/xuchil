"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import XuchilHeader from "@/components/HeaderXuchil";
import DynamicTable from "@/components/DynamicTable";
import { movementColumns } from "@/constants/tableData";
import styles from "./DetailPage.module.css";

type DetailItem = {
  name: string;
  presentation?: string;
  quantity: number;
  units: string;
  defaultUnitId: number | null;
  lots: Array<{ id: number }>;
};

interface UnitOption {
  id: number;
  name: string;
}

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<DetailItem | null>(null);
  const [movimientos, setMovimientos] = useState<Array<{ movimiento: string; fecha: string }>>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [restockQty, setRestockQty] = useState("");
  const [restockUnitId, setRestockUnitId] = useState<string>("");
  const [restocking, setRestocking] = useState(false);
  const [restockError, setRestockError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const itemResponse = await fetch(`/api/inventory/items/${id}`, { credentials: "include" });
    if (!itemResponse.ok) return;
    const data = await itemResponse.json();

    const qty = (data.inventoryLots || []).reduce(
      (sum: number, lot: any) => sum + Number(lot.qtyOnHand || 0),
      0
    );

    const defaultUnitId =
      data.rawMaterial?.defaultUnitId ??
      data.productVariant?.defaultUnitId ??
      data.defaultUnitId ??
      data.inventoryLots?.[0]?.unitId ??
      null;

    const mappedItem: DetailItem = {
      name: data.itemType === "RAW"
        ? data.rawMaterial?.name ?? "Materia prima"
        : data.productVariant?.product?.name ?? "Producto",
      presentation: data.itemType === "RAW"
        ? undefined
        : data.productVariant?.name ?? data.productVariant?.presentation ?? "",
      quantity: qty,
      units:
        data.rawMaterial?.defaultUnit?.name ||
        data.productVariant?.defaultUnit?.name ||
        data.inventoryLots?.[0]?.unit?.name ||
        "",
      defaultUnitId,
      lots: data.inventoryLots || [],
    };

    const movementRows: Array<{ movimiento: string; fecha: string }> = [];
    for (const lot of mappedItem.lots) {
      const movementResponse = await fetch(`/api/inventory/lots/${lot.id}/movements`, { credentials: "include" });
      if (!movementResponse.ok) continue;
      const movements = await movementResponse.json();
      movements.forEach((movement: any) => {
        movementRows.push({
          movimiento: `${movement.direction} ${movement.qty} (${movement.reason})`,
          fecha: movement.movedAt
            ? new Date(movement.movedAt).toLocaleDateString("es-MX")
            : "",
        });
      });
    }

    setItem(mappedItem);
    setMovimientos(movementRows);
    setRestockUnitId((prev) => prev || (defaultUnitId ? String(defaultUnitId) : ""));
  }, [id]);

  useEffect(() => {
    let mounted = true;

    async function loadUnits() {
      const res = await fetch("/api/units", { credentials: "include" });
      if (res.ok && mounted) setUnits(await res.json());
    }

    loadUnits();
    load();

    return () => {
      mounted = false;
    };
  }, [id, load]);

  const handleRestock = async () => {
    setRestockError(null);
    const qty = Number(restockQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setRestockError("Ingresa una cantidad mayor a 0.");
      return;
    }
    try {
      setRestocking(true);
      const response = await fetch(`/api/inventory/items/${id}/restock`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qty,
          unitId: restockUnitId ? parseInt(restockUnitId, 10) : undefined,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo agregar stock.");
      }
      setRestockQty("");
      await load();
    } catch (err) {
      setRestockError(err instanceof Error ? err.message : "No se pudo agregar stock.");
    } finally {
      setRestocking(false);
    }
  };

  if (!item) return <p>Producto no encontrado</p>;

  return (
    <div className={styles.wrapper}>
      <XuchilHeader />
      <h1 className={styles.title}>
        {item.name}
        {item.presentation ? (
          <>
            <br />({item.presentation})
          </>
        ) : null}
      </h1>
      <p className={styles.subtitle}>
        En inventario: <strong>{item.quantity} {item.units}</strong>
      </p>

      <div className={styles.restockBar}>
        <input
          type="number"
          min="0"
          step="0.001"
          className={styles.restockInput}
          placeholder="Cantidad"
          value={restockQty}
          onChange={(e) => setRestockQty(e.target.value)}
        />
        <select
          className={styles.restockSelect}
          value={restockUnitId}
          onChange={(e) => setRestockUnitId(e.target.value)}
        >
          <option value="">Unidad...</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.restockButton}
          onClick={handleRestock}
          disabled={restocking}
        >
          {restocking ? "Agregando..." : "Agregar stock"}
        </button>
        {restockError ? <p className={styles.restockError}>{restockError}</p> : null}
      </div>

      <DynamicTable columns={movementColumns} data={movimientos} />
    </div>
  );
}
