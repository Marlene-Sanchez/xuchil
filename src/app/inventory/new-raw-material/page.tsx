"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HeaderXuchil from "@/components/HeaderXuchil";
import BottomButton from "@/components/BottomButton";
import TextField from "@/components/TextField";
import styles from "./NewRawMaterial.module.css";

const unitOptions = [
  { id: 1, label: "kg" },
  { id: 2, label: "g" },
  { id: 3, label: "L" },
  { id: 4, label: "mL" },
  { id: 5, label: "unidad" },
];

const NewRawMaterialPage = () => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [stock, setStock] = useState<number>(0);
  const [defaultUnitId, setDefaultUnitId] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      code: code.trim(),
      name: name.trim(),
      defaultUnitId,
      imageUrl: image.trim() || null,
      isActive: true,
      initialStock: stock > 0 ? stock : undefined,
      lotCode: stock > 0 ? `RAW-${code.trim() || name.trim()}-${Date.now()}` : undefined,
      receivedAt: stock > 0 ? new Date().toISOString() : undefined,
    };

    try {
      const response = await fetch("/api/raw-materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Error creando materia prima");
      }

      router.replace("/inventory/raw");
    } catch (err: any) {
      setError(err.message || "Error creando materia prima");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <HeaderXuchil />

      <h1 className={styles.title}>Nueva Materia Prima</h1>

      <h3 className={styles.fieldLabel}>Código:</h3>
      <div className={styles.fieldContainer}>
        <TextField
          placeholder="Ej. MP009"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      <h3 className={styles.fieldLabel}>Nombre:</h3>
      <div className={styles.fieldContainer}>
        <TextField
          placeholder="Ej. Harina de trigo"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <h3 className={styles.fieldLabel}>Imagen (URL):</h3>
      <div className={styles.fieldContainer}>
        <TextField
          placeholder="https://ejemplo.com/imagen.jpg"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
      </div>

      <h3 className={styles.fieldLabel}>Stock inicial:</h3>
      <div className={styles.fieldContainer}>
        <TextField
          placeholder="Cantidad"
          value={stock.toString()}
          onChange={(e) => setStock(Number(e.target.value))}
        />
      </div>

      <h3 className={styles.fieldLabel}>Unidades:</h3>
      <div className={`${styles.fieldContainer} ${styles.centeredControl}`}>
        <select
          className={styles.select}
          value={defaultUnitId}
          onChange={(e) => setDefaultUnitId(Number(e.target.value))}
        >
          {unitOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <BottomButton onClick={handleSubmit} disabled={loading}>
        {loading ? "Guardando..." : "Registrar materia prima"}
      </BottomButton>
    </div>
  );
};

export default NewRawMaterialPage;