"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { fetchProducts, fetchRawMaterials } from "@/constants/api";
import { movementData } from "@/constants/tableData";
import styles from "./DetailPage.module.css";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function fechaCorta(valor: string) {
  const partes = valor.split("/");
  if (partes.length !== 3) return valor;
  const dia = Number(partes[0]);
  const mes = Number(partes[1]);
  if (Number.isNaN(dia) || Number.isNaN(mes) || mes < 1 || mes > 12) return valor;
  return `${dia} ${MESES[mes - 1]}`;
}

function partirMovimiento(texto: string) {
  const corte = texto.indexOf(" de ");
  if (corte === -1) return { tipo: texto, detalle: "" };
  return {
    tipo: texto.slice(0, corte),
    detalle: texto.slice(corte + 4),
  };
}

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const productos = fetchProducts();
  const materias = fetchRawMaterials();
  const item = [...productos, ...materias].find((p) => p.id === id);

  if (!item) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.notFound}>Producto no encontrado</p>
      </div>
    );
  }

  const esProducto = productos.some((p) => p.id === id);
  const volverA = esProducto ? "/inventory/products" : "/inventory/raw";
  const movimientos = movementData.filter((m) => m.productId === id);

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.back}
        onClick={() => router.push(volverA)}
      >
        <ChevronLeft size={18} />
        Inventario
      </button>

      <header className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.title}>{item.name}</h1>
          {!!item.presentation && (
            <p className={styles.presentation}>{item.presentation}</p>
          )}
        </div>

        <p className={styles.stock}>
          <span className={styles.stockValue}>{item.quantity}</span>
          <span className={styles.stockUnit}>{item.units}</span>
        </p>
      </header>

      <p className={styles.sectionLabel}>Movimientos</p>

      <section className={styles.card}>
        {movimientos.length === 0 ? (
          <p className={styles.empty}>Sin movimientos registrados</p>
        ) : (
          <ul className={styles.list}>
            {movimientos.map((m, i) => {
              const { tipo, detalle } = partirMovimiento(m.movimiento);
              return (
                <li className={styles.row} key={`${m.fecha}-${i}`}>
                  <div className={styles.rowText}>
                    <p className={styles.rowType}>{tipo}</p>
                    {!!detalle && <p className={styles.rowDetail}>{detalle}</p>}
                  </div>
                  <p className={styles.rowDate}>{fechaCorta(m.fecha)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
