"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import UnitField from "@/components/UnitField";
import TextField from "@/components/TextField";
import Button from "@/components/Button";
import styles from "./ProcessResults.module.css";

const ProcessResultsPage: React.FC = () => {
  const [productQty, setProductQty] = useState("");
  const [wasteQty, setWasteQty] = useState("");
  const [observations, setObservations] = useState("");

  const router = useRouter();

  const handleFinishProcess = () => {
    // TODO: Implement insertion into Inventory Table
    router.push("/inventory");
  };

  return (
    <div className="page">

      <div className={styles.container}>
        <h1 className={styles.title}>Resultados</h1>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="producto">
            Producto
          </label>
          <UnitField
            id="producto"
            block
            value={productQty}
            onChange={setProductQty}
            unit="Kg"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="merma">
            Merma
          </label>
          <UnitField
            id="merma"
            block
            value={wasteQty}
            onChange={setWasteQty}
            unit="Kg"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="observaciones">
            Observaciones <span className={styles.optional}>(opcional)</span>
          </label>
          <TextField
            id="observaciones"
            block
            placeholder="Escribe tus observaciones aquí"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <Button action="outline" onClick={() => router.back()}>
            Atrás
          </Button>
          <Button action="primary" onClick={handleFinishProcess}>
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProcessResultsPage;
