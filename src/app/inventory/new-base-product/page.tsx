"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeaderXuchil from "@/components/HeaderXuchil";
import BottomButton from "@/components/BottomButton";
import TextField from "@/components/TextField";
import styles from "./NewBaseProduct.module.css";

interface CategoryOption {
  id: number;
  name: string;
}

interface UnitOption {
  id: number;
  name: string;
}

const NewBaseProductPage = () => {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [defaultUnitId, setDefaultUnitId] = useState<string>("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingSku, setGeneratingSku] = useState(false);
  const [skuHint, setSkuHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [catsRes, unitsRes] = await Promise.all([
          fetch("/api/product-categories", { credentials: "include" }),
          fetch("/api/units", { credentials: "include" }),
        ]);
        if (mounted && catsRes.ok) setCategories(await catsRes.json());
        if (mounted && unitsRes.ok) setUnits(await unitsRes.json());
      } catch (err) {
        console.error("Failed to load base product form data:", err);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleGenerateSku = async () => {
    setError(null);
    if (!categoryId) {
      setError("Selecciona primero una categoría para generar el SKU.");
      return;
    }
    try {
      setGeneratingSku(true);
      const response = await fetch(`/api/products/next-sku?category_id=${categoryId}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("No se pudo generar el SKU.");
      }
      const data = await response.json();
      setSku(data.sku);
      setSkuHint(data.convention);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el SKU.");
    } finally {
      setGeneratingSku(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!categoryId) {
      setError("La categoría es obligatoria.");
      return;
    }
    const trimmedName = name.trim();
    const trimmedSku = sku.trim();
    if (!trimmedName) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!trimmedSku) {
      setError("El SKU es obligatorio.");
      return;
    }

    const payload = {
      categoryId: parseInt(categoryId, 10),
      sku: trimmedSku,
      name: trimmedName,
      defaultUnitId: defaultUnitId ? parseInt(defaultUnitId, 10) : null,
      imageUrl: image.trim() || null,
      isActive: true,
    };

    try {
      setLoading(true);
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "No se pudo registrar el producto.");
      }

      router.replace("/inventory/new-product");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el producto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <HeaderXuchil />

      <h1 className={styles.title}>Nuevo Producto Base</h1>

      <h3 className={styles.fieldLabel}>Categoría:</h3>
      <div className={`${styles.fieldContainer} ${styles.centeredControl}`}>
        <select
          className={styles.select}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <h3 className={styles.fieldLabel}>Nombre:</h3>
      <div className={styles.fieldContainer}>
        <TextField
          placeholder="Ej. Harina de mezquite"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <h3 className={styles.fieldLabel}>SKU:</h3>
      <div className={styles.fieldContainer}>
        <div className={styles.codeRow}>
          <TextField
            placeholder="Ej. HAR001"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
          <button
            type="button"
            className={styles.generateButton}
            onClick={handleGenerateSku}
            disabled={generatingSku}
          >
            {generatingSku ? "Generando..." : "Generar"}
          </button>
        </div>
      </div>
      {skuHint ? <p className={styles.hint}>{skuHint}</p> : null}

      <h3 className={styles.fieldLabel}>Unidad por defecto (opcional):</h3>
      <div className={`${styles.fieldContainer} ${styles.centeredControl}`}>
        <select
          className={styles.select}
          value={defaultUnitId}
          onChange={(e) => setDefaultUnitId(e.target.value)}
        >
          <option value="">Sin definir</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
      </div>

      <h3 className={styles.fieldLabel}>Imagen (URL):</h3>
      <div className={styles.fieldContainer}>
        <TextField
          placeholder="https://ejemplo.com/imagen.jpg"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <BottomButton onClick={handleSubmit} disabled={loading}>
        {loading ? "Guardando..." : "Registrar producto"}
      </BottomButton>
    </div>
  );
};

export default NewBaseProductPage;
