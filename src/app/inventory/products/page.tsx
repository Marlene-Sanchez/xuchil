"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import HeaderNavigator from "@/components/HeaderNavigator";
import FilterButton from "@/components/FilterButton";
import { inventoryTabs } from "@/constants/navTabs";
import { inventorySortOptions } from "@/constants/filterOptions";
import { FilterOption } from "@/types/FilterOption";
import styles from "../InventoryPage.module.css";
import { fetchProducts } from "@/constants/api";
import { Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProductsInventoryPage() {
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<FilterOption>(inventorySortOptions[0]);
    const router = useRouter();
    const products = useMemo(fetchProducts, []);

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        const list = products.filter((item) =>
            item.name.toLowerCase().includes(term)
        );

        return [...list].sort((a, b) => {
            if (sort.value === "qty-desc") return Number(b.quantity) - Number(a.quantity);
            if (sort.value === "qty-asc") return Number(a.quantity) - Number(b.quantity);
            return a.name.localeCompare(b.name, "es");
        });
    }, [products, search, sort]);

    return (
        <div className={styles.wrapper}>
            <h1 className={styles.title}>Inventario</h1>

            <HeaderNavigator tabs={inventoryTabs} variant="full" />

            <div className={styles.toolbar}>
                <div className={styles.search}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar elementos"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <FilterButton
                    title="Ordenar"
                    options={inventorySortOptions}
                    onChange={setSort}
                    variant="outline"
                />
            </div>

            <div className={styles.cardList}>
                {visible.map((item) => (
                    <ProductCard
                        photo={item.image}
                        key={item.id}
                        {...item}
                        onClick={() => router.push(`/inventory/details/${item.id}`)}
                    />
                ))}

                {visible.length === 0 && (
                    <p className={styles.noResults}>
                        Ningún producto coincide con la búsqueda.
                    </p>
                )}

                <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => router.push("/inventory/new-product")}
                >
                    <Plus size={20} strokeWidth={2.5} />
                    <span>Añadir producto</span>
                </button>
            </div>
        </div>
    );
}
