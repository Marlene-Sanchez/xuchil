"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PendingTaskCard from "@/components/PendingTaskCard";
import styles from "./PendingTasks.module.css";
import { fetchPendingTasks } from "@/constants/api";
import { PendingTask } from "@/types/PendingTask";

const PendingTasksPage = () => {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const router = useRouter();

  useEffect(() => {
    const data = fetchPendingTasks();
    setTasks(data);
  }, []);

  return (
    <div className={styles.wrapper}>
      <header className={styles.head}>
        <h1 className={styles.title}>Tareas pendientes</h1>
        {tasks.length > 0 && (
          <span className={styles.count}>
            {tasks.length} {tasks.length === 1 ? "proceso" : "procesos"}
          </span>
        )}
      </header>

      {tasks.length === 0 ? (
        <p className={styles.empty}>No hay procesos en curso</p>
      ) : (
        <ul className={styles.list}>
          {tasks.map((task) => (
            <li key={task.id}>
              <PendingTaskCard
                productName={task.productName}
                startDate={task.startDate}
                startedBy={task.startedBy}
                currentStep={task.currentStep}
                currentStepNumber={task.currentStepNumber}
                totalSteps={task.totalSteps}
                onClick={() =>
                  router.push(
                    `/process-control/new-production/${task.productId}/${task.variantId}`
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PendingTasksPage;
