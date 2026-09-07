"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import StepRow from "@/components/StepRow";
import UnitField from "@/components/UnitField";
import TextField from "@/components/TextField";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { Check } from "lucide-react";
import styles from "./ProcessRun.module.css";
import { fetchProcessSteps, fetchProductVariants } from "@/constants/api";
import { ProcessStep } from "@/types/ProcessStep";

const AUTO_ADVANCE_ON_TIME = true;

function inputTypeOf(step: ProcessStep): "number" | "text" {
  return step.inputType ?? (step.unit ? "number" : "text");
}

const ProcessRunPage = () => {
  const { productId, variantId } = useParams<{
    productId: string;
    variantId: string;
  }>();
  const router = useRouter();

  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [variantName, setVariantName] = useState<string>("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [doneIds, setDoneIds] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);

  const [entries, setEntries] = useState<Record<number, string>>({});
  const [draft, setDraft] = useState("");
  const draftRef = useRef("");
  draftRef.current = draft;

  const [noteStepId, setNoteStepId] = useState<number | null>(null);

  useEffect(() => {
    const variants = fetchProductVariants(productId);
    setVariantName(variants.find((v) => v.id === variantId)?.name ?? "");
    setSteps(fetchProcessSteps(productId, variantId));
    setCurrentIndex(0);
    setDoneIds([]);
    setElapsed(0);
    setStarted(false);
    setRunning(false);
    setEntries({});
    setDraft("");
  }, [productId, variantId]);

  const currentStep: ProcessStep | undefined = steps[currentIndex];
  const goalSeconds = currentStep
    ? Math.max(1, currentStep.estimatedTime * 60)
    : 0;

  const allDone = steps.length > 0 && currentIndex >= steps.length;

  const finishStep = useCallback(() => {
    if (!currentStep) return;

    const raw = draftRef.current.trim();
    if (raw) {
      const value =
        inputTypeOf(currentStep) === "number"
          ? `${raw} ${currentStep.unit ?? "Kg"}`
          : raw;
      setEntries((prev) => ({ ...prev, [currentStep.id]: value }));
    }

    setDoneIds((prev) => [...prev, currentStep.id]);
    setDraft("");
    setElapsed(0);
    setStarted(false);
    setRunning(false);
    setCurrentIndex((i) => i + 1);
  }, [currentStep]);

  useEffect(() => {
    if (!started || !running || !currentStep) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [started, running, currentStep]);

  useEffect(() => {
    if (!AUTO_ADVANCE_ON_TIME) return;
    if (!started || !currentStep) return;
    if (elapsed >= goalSeconds) finishStep();
  }, [started, elapsed, goalSeconds, currentStep, finishStep]);

  const goToResults = useCallback(() => {
    try {
      sessionStorage.setItem(
        `xuchil:run:${productId}:${variantId}`,
        JSON.stringify(entries)
      );
    } catch {
    }

    router.push(
      `/process-control/new-production/${productId}/${variantId}/results`
    );
  }, [entries, productId, variantId, router]);

  useEffect(() => {
    if (!allDone) return;
    goToResults();
  }, [allDone, goToResults]);

  if (steps.length === 0) {
    return (
      <div className="page">
        <h1>Cargando información del proceso...</h1>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="page">
        <div className={styles.container}>
          <div className={styles.finished}>
            <span className={styles.finishedIcon}>
              <Check size={44} strokeWidth={2.5} />
            </span>
            <h1 className={styles.processTitle}>Proceso terminado</h1>
            <p className={styles.finishedText}>
              {steps.length} pasos completados. Falta registrar el producto
              obtenido y la merma.
            </p>
            <Button onClick={goToResults}>Ver resultados</Button>
          </div>
        </div>
      </div>
    );
  }

  const positionOf = (step: ProcessStep) =>
    steps.findIndex((s) => s.id === step.id) + 1;

  const upcoming = steps.slice(currentIndex + 1);
  const done = doneIds
    .map((id) => steps.find((s) => s.id === id))
    .filter((s): s is ProcessStep => Boolean(s));

  const noteStep = steps.find((s) => s.id === noteStepId);
  const overallPct = (doneIds.length / steps.length) * 100;

  return (
    <div className="page">

      <div className={styles.container}>
        <header className={styles.head}>
          <h1 className={styles.processTitle}>
            {variantName ? `Elaboración de ${variantName}` : "Proceso"}
          </h1>
          <div className={styles.overall}>
            <div
              className={styles.overallFill}
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className={styles.overallLabel}>
            {doneIds.length} de {steps.length} pasos terminados
          </p>
        </header>

        <ul className={styles.list}>
          {currentStep && (
            <StepRow
              key={currentStep.id}
              step={currentStep}
              position={positionOf(currentStep)}
              total={steps.length}
              state="active"
              elapsed={elapsed}
              started={started}
              running={running}
              onToggleRunning={() => {
                setStarted(true);
                setRunning((r) => !r);
              }}
              onSkip={finishStep}
            >
              {currentStep.hasInput &&
                (inputTypeOf(currentStep) === "text" ? (
                  <>
                    <label className={styles.inputLabel}>
                      Registro de este paso
                    </label>
                    <TextField
                      block
                      autoGrow
                      rows={2}
                      placeholder="Escribe aquí lo que observaste..."
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <label className={styles.inputLabel}>Cantidad</label>
                    <UnitField
                      block
                      value={draft}
                      onChange={setDraft}
                      unit={currentStep.unit ?? "Kg"}
                    />
                  </>
                ))}
            </StepRow>
          )}

          {upcoming.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              position={positionOf(step)}
              total={steps.length}
              state="upcoming"
            />
          ))}

          {done.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              position={positionOf(step)}
              total={steps.length}
              state="done"
              noteValue={entries[step.id]}
              onOpenNote={() => setNoteStepId(step.id)}
            />
          ))}
        </ul>
      </div>

      <Modal
        open={noteStepId !== null}
        title={noteStep?.title}
        message={noteStepId !== null ? entries[noteStepId] ?? "" : ""}
        onlyConfirm
        confirmText="Cerrar"
        onConfirm={() => setNoteStepId(null)}
      />
    </div>
  );
};

export default ProcessRunPage;
