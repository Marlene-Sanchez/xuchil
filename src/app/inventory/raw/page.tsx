"use client";

import { useEffect, useState } from "react";
import BottomButton from "@/components/BottomButton";
import ProductCard from "@/components/ProductCard";
import styles from "../InventoryPage.module.css";
import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

type InventoryRawRow = {
  id: number;
  name: string;
  image: string;
  presentation: string;
  quantity: number;
  units: string;
  note?: string;
};

const formatQty = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/\.?0+$/, "");

export default function RawInventoryPage() {
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState<InventoryRawRow[]>([]);
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        async function load() {
            const [summaryRes, availabilityRes] = await Promise.all([
                fetch("/api/inventory/summary?item_type=RAW", { credentials: "include" }),
                fetch("/api/raw-materials/availability", { credentials: "include" }),
            ]);
            if (!summaryRes.ok) return;
            const data = await summaryRes.json();
            if (!mounted) return;

            const availabilityByMaterial = new Map<number, any>();
            if (availabilityRes.ok) {
                const availability = await availabilityRes.json();
                for (const entry of availability) {
                    availabilityByMaterial.set(entry.rawMaterialId, entry);
                }
            }

            const mapped = data.map((item: any) => {
                const qty = (item.inventoryLots || []).reduce(
                    (sum: number, lot: any) => sum + Number(lot.qtyOnHand || 0),
                    0
                );
                const units =
                    item.rawMaterial?.defaultUnit?.name ||
                    item.inventoryLots?.[0]?.unit?.name ||
                    "";

                const availability = availabilityByMaterial.get(item.rawMaterial?.id);
                let note: string | undefined;
                if (availability) {
                    const factor = availability.defaultUnitFactor || 1;
                    const reserved = factor > 0 ? availability.reservedBase / factor : availability.reservedBase;
                    const available = availability.availableInDefaultUnit ?? 0;
                    if (reserved > 0) {
                        note = `Apartado: ${formatQty(reserved)} ${units} · Disponible: ${formatQty(available)} ${units}`;
                    }
                }

                return {
                    id: item.id,
                    name: item.rawMaterial?.name ?? "Materia prima",
                    image: item.rawMaterial?.imageUrl ?? "/globe.svg",
                    presentation: "",
                    quantity: qty,
                    units,
                    note,
                };
            });

            setProducts(mapped);
        }

        load();

        return () => {
            mounted = false;
        };
    }, []);

    const filtered = products.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.wrapper}>
            <div className={styles.searchBar}>
                <div className={styles.searchBarInner}>
                    <Search size={24} color="#4a6548" />
                    <input
                        type="text"
                        placeholder="Buscar elementos"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <SlidersHorizontal size={24} color="#4a6548" />
                </div>
            </div>


            <div className={styles.cardList}>
                {filtered.map((item) => (
                    <ProductCard photo={item.image} key={item.id} {...item} onClick={() => router.push(`/inventory/details/${item.id}`)}/>
                ))}
            </div>

            <BottomButton onClick={() => router.push(`/inventory/new-raw-material`)}>
                Añadir Registro
            </BottomButton>
        </div>
    );
}

