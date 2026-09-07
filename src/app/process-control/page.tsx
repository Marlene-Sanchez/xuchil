"use client";

import { useRouter } from "next/navigation";
import { Factory, ClipboardList, ChevronRight, Plus } from "lucide-react";
import styles from "./ProcessControl.module.css";

const ProcessControl = () => {
  const router = useRouter();

  const secciones = [
    {
      id: "nueva-produccion",
      titulo: "Nueva producción",
      texto: "Inicia el proceso de un producto",
      icono: <Factory size={26} />,
      ruta: "/process-control/new-production",
    },
    {
      id: "tareas-pendientes",
      titulo: "Tareas pendientes",
      texto: "Retoma un proceso en curso",
      icono: <ClipboardList size={26} />,
      ruta: "/process-control/pending-tasks",
    },
  ];

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Control de procesos</h1>

      <div className={styles.list}>
        {secciones.map((seccion) => (
          <button
            type="button"
            key={seccion.id}
            className={styles.card}
            onClick={() => router.push(seccion.ruta)}
          >
            <span className={styles.cardIcon}>{seccion.icono}</span>

            <span className={styles.cardBody}>
              <span className={styles.cardTitle}>{seccion.titulo}</span>
              <span className={styles.cardText}>{seccion.texto}</span>
            </span>

            <ChevronRight size={18} className={styles.cardChevron} />
          </button>
        ))}

        <button
          type="button"
          className={styles.addBtn}
          onClick={() => router.push("/process-control/new-process")}
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>Nuevo proceso</span>
        </button>
      </div>
    </div>
  );
};

export default ProcessControl;
