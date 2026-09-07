"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import TextField from "@/components/TextField";
import DatePicker from "@/components/DatePicker";
import OrderedProducts from "@/components/OrderedProducts";
import Button from "@/components/Button";
import { Product } from "@/types/Product";
import { deliveryVariants, availableVariants } from "@/constants/deliveryConfig";
import { fetchProducts } from "@/constants/api";
import styles from "./NewOrder.module.css";

const shortDeliveryLabels: Record<keyof typeof deliveryVariants, string> = {
  mail: "Correo",
  personal: "Personal",
  consignment: "Consignación",
};

const NewOrderPage = () => {
  const products: Product[] = useMemo(fetchProducts, []);
  const [clientName, setClientName] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
  const [address, setAddress] = useState("");
  const [deliveryVariant, setDeliveryVariant] = useState<
    keyof typeof deliveryVariants
  >("mail");

  const router = useRouter();

  const handleSubmit = () => {
    console.table({
      clientName,
      deliveryDate,
      address,
      deliveryVariant,
    });

    router.replace("/orders/deliveries");
  };

  return (
    <div className="page">

      <div className={styles.card}>
        <h1 className={styles.title}>Nuevo pedido</h1>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="cliente">
            Cliente
          </label>
          <input
            id="cliente"
            type="text"
            className={styles.input}
            placeholder="Nombre del cliente"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Método de entrega</span>
          <div className={styles.segment} role="radiogroup" aria-label="Método de entrega">
            {availableVariants.map((variant) => (
              <button
                key={variant}
                type="button"
                role="radio"
                aria-checked={deliveryVariant === variant}
                className={`${styles.segmentOption} ${
                  deliveryVariant === variant ? styles.segmentActive : ""
                }`}
                onClick={() => setDeliveryVariant(variant)}
              >
                {shortDeliveryLabels[variant]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Fecha de entrega</span>
          <DatePicker value={deliveryDate} onChange={setDeliveryDate} />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="direccion">
            Dirección de entrega
          </label>
          <TextField
            id="direccion"
            block
            placeholder="Calle, número, colonia, ciudad"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Productos</span>
          <OrderedProducts products={products} />
        </div>

        <div className={styles.submit}>
          <Button onClick={handleSubmit}>Crear pedido</Button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderPage;
