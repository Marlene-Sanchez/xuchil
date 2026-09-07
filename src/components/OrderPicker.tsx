"use client";

import React, { useState } from "react";
import styles from "@/styles/OrderPicker.module.css";
import { Trash2 } from "lucide-react";
import ProductPicker from "@/components/ProductPicker";
import QuantityPicker from "@/components/QuantityPicker";
import DeleteModal from "@/components/DeleteModal";
import { Product } from "@/types/Product";

interface OrderPickerProps {
  index: number;
  products: Product[];
  onDelete: () => void;
}

const OrderPicker: React.FC<OrderPickerProps> = ({ products, onDelete }) => {
  const [units, setUnits] = useState(1);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className={styles.card}>
        <div className={styles.header}>
          <ProductPicker products={products} />

          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => setShowModal(true)}
            aria-label="Quitar producto del pedido"
            title="Quitar producto"
          >
            <Trash2 size={20} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.unitsRow}>
          <span className={styles.unitsLabel}>Unidades</span>
          <QuantityPicker value={units} onChange={setUnits} min={1} />
        </div>
      </div>

      {showModal && (
        <DeleteModal
          message="¿Deseas eliminar este producto del pedido?"
          onCancel={() => setShowModal(false)}
          onConfirm={() => {
            setShowModal(false);
            onDelete();
          }}
        />
      )}
    </>
  );
};

export default OrderPicker;
