"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import HeaderXuchil from "@/components/HeaderXuchil";
import Chronometer from "@/components/Chronometer";
import BottomButton from "@/components/BottomButton";
import UnitField from "@/components/UnitField";
import styles from "./ProcessStep.module.css";
import { ProcessStep } from "@/types/ProcessStep";
import { ProductVariant } from "@/types/ProductVariant";

const ProcessStepPage = () => {
  const { productId, variantId, stepId } = useParams();
  const router = useRouter();

  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>();
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [currentStep, setCurrentStep] = useState<ProcessStep | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  // API-linked state
  const [stepExecutionId, setStepExecutionId] = useState<number | null>(null);
  const [processRunId, setProcessRunId] = useState<number | null>(null);
  const [stepStatus, setStepStatus] = useState<string>("PENDING");
  const [initialTime, setInitialTime] = useState(0);
  const [templateId, setTemplateId] = useState<number | null>(null);

  // Reservation / consumption state
  const [runHasReservations, setRunHasReservations] = useState(false);
  const [reserveQty, setReserveQty] = useState<Record<string, number>>({});
  const [consumeQty, setConsumeQty] = useState<Record<number, number>>({});
  const [reserving, setReserving] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);

  // Use a ref to avoid stale closure issues with stepExecutionId
  const stepExecIdRef = React.useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      // stepId from URL is a 1-based position number (1, 2, 3...)
      const stepPosition = parseInt((stepId as string) || "1", 10);
      const positionIndex = stepPosition - 1; // convert to 0-based

      const variantRes = await fetch(`/api/product-variants?category_id=${productId}`, { credentials: "include" });
      if (!variantRes.ok) {
        if (mounted) setLoadError("No se pudieron cargar las variantes del producto.");
        return;
      }
      const variants = await variantRes.json();
      const stringVariantId = variantId as string;
      const variant = variants.find((item: any) => String(item.id) === stringVariantId);
      if (!variant) {
        if (mounted) setLoadError("No se encontró la variante seleccionada.");
        return;
      }

      const mappedVariant: ProductVariant = {
        id: String(variant.id),
        name: variant.name,
        imageSrc: variant.imageUrl || "/globe.svg",
      };

      const templatesRes = await fetch(`/api/process-templates?product_variant_id=${variant.id}`, { credentials: "include" });
      if (!templatesRes.ok) {
        if (mounted) setLoadError("No se pudieron cargar las plantillas de proceso.");
        return;
      }
      const templates = await templatesRes.json();
      const activeTemplate = templates.find((template: any) => template.isActive) || templates[0];
      if (!activeTemplate) {
        if (mounted) {
          setCurrentVariant(mappedVariant);
          setLoadError("Este producto no tiene un proceso de producción configurado. Ve a configuración para crear una plantilla.");
        }
        return;
      }

      const templateDetailRes = await fetch(`/api/process-templates/${activeTemplate.id}`, { credentials: "include" });
      if (!templateDetailRes.ok) {
        if (mounted) setLoadError("No se pudo cargar el detalle de la plantilla.");
        return;
      }
      const templateDetail = await templateDetailRes.json();

      const allSteps: ProcessStep[] = (templateDetail.templateSteps || []).map((step: any) => ({
        id: step.id,
        title: step.name,
        estimatedTime: step.idealDurationMin ?? 0,
        hasInput: step.requiresInput,
        unit: "",
        description: step.instructions ?? "",
        materials: (step.stepRequiredMaterials || []).map((srm: any) => ({
          rawMaterialId: srm.rawMaterialId,
          name: srm.rawMaterial?.name ?? `Materia prima ${srm.rawMaterialId}`,
          qtyPerUnitOutput: Number(srm.qtyPerUnitOutput),
          unitId: srm.unitId,
          unitName: srm.unit?.name ?? "",
        })),
      }));

      if (allSteps.length === 0) {
        if (mounted) {
          setCurrentVariant(mappedVariant);
          setLoadError("La plantilla de proceso no tiene pasos definidos.");
        }
        return;
      }

      if (mounted) {
        setTemplateId(activeTemplate.id);
      }

      // Load active process run for this variant
      let foundRun: any = null;
      const pendingRes = await fetch("/api/process-runs/pending", { credentials: "include" });
      if (pendingRes.ok) {
        const pendingRuns = await pendingRes.json();
        const activeRun = pendingRuns.find((run: any) => String(run.productVariantId) === stringVariantId);
        if (activeRun) {
          foundRun = activeRun;
          if (mounted) {
            setProcessRunId(activeRun.id);
          }
          // Step executions are ordered by id (same order as template steps)
          const orderedExecs = [...(activeRun.stepExecutions || [])];
          const stepExec = orderedExecs[positionIndex];

          if (stepExec && mounted) {
            stepExecIdRef.current = stepExec.id;
            setStepExecutionId(stepExec.id);
            setStepStatus(stepExec.status);

            // If step was already started, calculate elapsed time
            if (stepExec.startedAt && (stepExec.status === "IN_PROGRESS" || stepExec.status === "BLOCKED")) {
              const elapsed = Math.floor((Date.now() - new Date(stepExec.startedAt).getTime()) / 1000);
              setInitialTime(Math.max(0, elapsed));
              setHasStarted(true);
            }
          }
        }
      }

      if (!mounted) return;

      const safeIndex = Math.max(0, Math.min(positionIndex, allSteps.length - 1));
      const activeStep = allSteps[safeIndex] || null;

      // Default quantities for the reservation panel (suggested per template).
      const rq: Record<string, number> = {};
      for (const s of allSteps) {
        for (const m of s.materials ?? []) {
          rq[`${s.id}:${m.rawMaterialId}`] = m.qtyPerUnitOutput;
        }
      }
      setReserveQty(rq);

      // Default consume quantities for the current step (from reservations if any).
      const reservations: any[] = foundRun?.materialReservations ?? [];
      setRunHasReservations(reservations.length > 0);
      const cq: Record<number, number> = {};
      for (const m of activeStep?.materials ?? []) {
        const reserved = reservations.find(
          (r) => r.templateStepId === activeStep!.id && r.rawMaterialId === m.rawMaterialId && r.status === "RESERVED"
        );
        cq[m.rawMaterialId] = reserved ? Number(reserved.qty) : m.qtyPerUnitOutput;
      }
      setConsumeQty(cq);

      setCurrentVariant(mappedVariant);
      setSteps(allSteps);
      setStepIndex(safeIndex);
      setCurrentStep(activeStep);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [productId, variantId, stepId]);

  const callStepActionDirect = async (execId: number, action: string, body?: object) => {
    try {
      const opts: RequestInit = {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`/api/step-executions/${execId}/${action}`, opts);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.error || `No se pudo ${action} el paso.` };
      }
      return { ok: true };
    } catch (e) {
      console.error(`Step action ${action} error:`, e);
      return { ok: false, error: "Error de red al ejecutar el paso." };
    }
  };

  const callStepAction = useCallback(async (action: string, body?: object) => {
    const id = stepExecIdRef.current;
    if (!id) {
      console.warn(`No stepExecutionId available for action: ${action}`);
      return { ok: false, error: "Paso no inicializado." };
    }
    return callStepActionDirect(id, action, body);
  }, []);

  const templateNeedsMaterials = steps.some((s) => (s.materials?.length ?? 0) > 0);
  const needsReservation =
    !stepExecutionId && !runHasReservations && templateNeedsMaterials && stepIndex === 0;
  const currentStepHasMaterials = (currentStep?.materials?.length ?? 0) > 0;

  // Build the consumption body for a step from a quantity map keyed by rawMaterialId.
  const consumeBody = (step: ProcessStep, qtyByMaterial: Record<number, number>) => {
    const materials = (step.materials ?? [])
      .map((m) => ({ rawMaterialId: m.rawMaterialId, qty: qtyByMaterial[m.rawMaterialId] ?? m.qtyPerUnitOutput, unitId: m.unitId }))
      .filter((m) => m.qty > 0);
    return materials.length ? { materials } : undefined;
  };

  const handleReserveAndStart = async () => {
    if (!templateId) return;
    setPanelError(null);
    setReserving(true);
    try {
      const numericVariantId = parseInt(variantId as string, 10);
      const runRes = await fetch("/api/process-runs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productVariantId: numericVariantId, processTemplateId: templateId }),
      });
      if (!runRes.ok) throw new Error("No se pudo crear el proceso.");
      const newRun = await runRes.json();

      const items: Array<{ templateStepId: number; rawMaterialId: number; qty: number; unitId: number }> = [];
      for (const s of steps) {
        for (const m of s.materials ?? []) {
          const qty = reserveQty[`${s.id}:${m.rawMaterialId}`] ?? m.qtyPerUnitOutput;
          if (qty > 0) items.push({ templateStepId: s.id, rawMaterialId: m.rawMaterialId, qty, unitId: m.unitId });
        }
      }

      const reserveRes = await fetch(`/api/process-runs/${newRun.id}/reserve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!reserveRes.ok) {
        const err = await reserveRes.json().catch(() => ({}));
        if (reserveRes.status === 409 && Array.isArray(err.insufficient)) {
          const names = err.insufficient.map((i: any) => i.name).join(", ");
          throw new Error(`Materia prima insuficiente: ${names}.`);
        }
        throw new Error(err.error || "No se pudo apartar la materia prima.");
      }

      // Start the current (first) step BEFORE switching the view, so the
      // reservation panel stays until the step truly starts (no flicker).
      const orderedExecs = newRun.stepExecutions || [];
      const stepExec = orderedExecs[stepIndex];
      if (!stepExec) {
        throw new Error("No se encontró el paso a iniciar.");
      }
      const body = currentStep
        ? consumeBody(currentStep, reserveStepQty(currentStep))
        : undefined;
      const result = await callStepActionDirect(stepExec.id, "start", body);
      if (!result.ok) {
        throw new Error(result.error);
      }

      // Everything succeeded: switch straight to the running chronometer.
      stepExecIdRef.current = stepExec.id;
      setProcessRunId(newRun.id);
      setRunHasReservations(true);
      setStepExecutionId(stepExec.id);
      setStepStatus("IN_PROGRESS");
      setInitialTime(0);
      setHasStarted(true);
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Error al apartar la materia prima.");
    } finally {
      setReserving(false);
    }
  };

  // Reserved quantities for a step, keyed by rawMaterialId, taken from reserveQty.
  const reserveStepQty = (step: ProcessStep): Record<number, number> => {
    const map: Record<number, number> = {};
    for (const m of step.materials ?? []) {
      map[m.rawMaterialId] = reserveQty[`${step.id}:${m.rawMaterialId}`] ?? m.qtyPerUnitOutput;
    }
    return map;
  };

  if (loadError) {
    return (
      <div className="page">
        <HeaderXuchil />
        <div className={styles.container}>
          <h2>{loadError}</h2>
          <BottomButton onClick={() => router.back()}>
            Volver
          </BottomButton>
        </div>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="page">
        <HeaderXuchil />
        <p>Cargando información del proceso...</p>
      </div>
    );
  }

  const handleChronometerStart = async () => {
    setHasStarted(true);

    // No run yet and template without materials: create the run and start (legacy path).
    if (!stepExecIdRef.current && templateId) {
      try {
        const numericVariantId = parseInt(variantId as string, 10);
        const res = await fetch("/api/process-runs", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productVariantId: numericVariantId, processTemplateId: templateId }),
        });
        if (res.ok) {
          const newRun = await res.json();
          setProcessRunId(newRun.id);
          const orderedExecs = newRun.stepExecutions || [];
          const stepExec = orderedExecs[stepIndex];
          if (stepExec) {
            stepExecIdRef.current = stepExec.id;
            setStepExecutionId(stepExec.id);
            setStepStatus("PENDING");
            const result = await callStepActionDirect(stepExec.id, "start");
            if (result.ok) setStepStatus("IN_PROGRESS");
            else setPanelError(result.error);
          }
        } else {
          setPanelError("No se pudo crear el proceso.");
        }
      } catch (e) {
        console.error("Error creating ProcessRun:", e);
        setPanelError("Error al crear el proceso.");
      }
    } else if (stepStatus === "PENDING") {
      const body = consumeBody(currentStep, consumeQty);
      const result = await callStepAction("start", body);
      if (result.ok) setStepStatus("IN_PROGRESS");
      else setPanelError(result.error);
    }
  };

  const handlePause = () => {
    callStepAction("pause", { reason: null });
    setStepStatus("BLOCKED");
  };

  const handleResume = () => {
    callStepAction("resume");
    setStepStatus("IN_PROGRESS");
  };

  const handleNextStep = async () => {
    // Stop the chronometer immediately
    setStepStatus("DONE");
    // Call finish - API handles both IN_PROGRESS and BLOCKED states
    await callStepAction("finish");
    // Navigate forward
    const nextPosition = stepIndex + 2;
    if (stepIndex < steps.length - 1) {
      router.push(`/process-control/new-production/${productId}/${variantId}/${nextPosition}`);
    } else {
      const route = processRunId
        ? `/process-control/new-production/${productId}/${variantId}/results?runId=${processRunId}`
        : `/process-control/new-production/${productId}/${variantId}/results`;
      router.push(route);
    }
  };

  return (
    <div className="page">
      <HeaderXuchil />
      <div className={styles.container}>
        <h1>{`Elaboración de ${currentVariant?.name}`}</h1>
        <h2>{`Paso ${stepIndex + 1} de ${steps.length}: ${currentStep.title}`}</h2>
        <p>{`${currentStep.description}`}</p>

        {needsReservation ? (
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Apartar materia prima del proceso</h3>
            {steps.map((s) =>
              (s.materials ?? []).map((m) => (
                <div key={`${s.id}:${m.rawMaterialId}`} className={styles.panelRow}>
                  <span className={styles.panelLabel}>{`${s.title}: ${m.name}`}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    className={styles.qtyInput}
                    value={reserveQty[`${s.id}:${m.rawMaterialId}`] ?? m.qtyPerUnitOutput}
                    onChange={(e) =>
                      setReserveQty((prev) => ({
                        ...prev,
                        [`${s.id}:${m.rawMaterialId}`]: Math.max(0, parseFloat(e.target.value) || 0),
                      }))
                    }
                  />
                  <span className={styles.unitTag}>{m.unitName}</span>
                </div>
              ))
            )}
            {panelError ? <p className={styles.panelError}>{panelError}</p> : null}
            <button
              type="button"
              className={styles.reserveButton}
              onClick={handleReserveAndStart}
              disabled={reserving}
            >
              {reserving ? "Apartando..." : "Apartar e iniciar proceso"}
            </button>
          </div>
        ) : (
          <>
            {!hasStarted && currentStep.hasInput && (
              <UnitField
                value={quantity}
                onChange={setQuantity}
                unit="Kg"
              />
            )}

            {!hasStarted && stepStatus === "PENDING" && currentStepHasMaterials && (
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>Materia prima a usar en este paso</h3>
                {(currentStep.materials ?? []).map((m) => (
                  <div key={m.rawMaterialId} className={styles.panelRow}>
                    <span className={styles.panelLabel}>{m.name}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      className={styles.qtyInput}
                      value={consumeQty[m.rawMaterialId] ?? m.qtyPerUnitOutput}
                      onChange={(e) =>
                        setConsumeQty((prev) => ({
                          ...prev,
                          [m.rawMaterialId]: Math.max(0, parseFloat(e.target.value) || 0),
                        }))
                      }
                    />
                    <span className={styles.unitTag}>{m.unitName}</span>
                  </div>
                ))}
              </div>
            )}

            <Chronometer
              estimatedTime={currentStep.estimatedTime}
              onStart={handleChronometerStart}
              onPause={handlePause}
              onResume={handleResume}
              initialTime={initialTime}
              initialRunning={stepStatus === "IN_PROGRESS"}
            />

            {panelError ? <p className={styles.panelError}>{panelError}</p> : null}

            {hasStarted && (
              <BottomButton onClick={handleNextStep}>
                Siguiente
              </BottomButton>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProcessStepPage;
