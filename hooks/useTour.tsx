"use client";

import { useEffect, useState, useRef } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { ConfirmationDialog } from "@/app/plataforma/[tenantId]/panel/components/alerts/ConfirmationDialog";

export function useTour(pageId: string, steps: DriveStep[], isReady: boolean = true) {
  const [hasSeenTour, setHasSeenTour] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const driverRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem(`tour_seen_${pageId}`);
      if (seen !== "true") {
        setHasSeenTour(false);
        if (isReady) {
          setTimeout(() => {
            startTour();
          }, 500);
        }
      } else {
        setHasSeenTour(true);
      }
    }
  }, [pageId, isReady]);

  const lastStepIndexRef = useRef<number>(0);
  const isConfirmingRef = useRef<boolean>(false);

  const confirmExit = () => {
    isConfirmingRef.current = true;
    localStorage.setItem(`tour_seen_${pageId}`, "true");
    setHasSeenTour(true);
    setShowConfirm(false);
    lastStepIndexRef.current = 0;
  };

  const cancelExit = () => {
    if (isConfirmingRef.current) {
      isConfirmingRef.current = false;
      return;
    }
    setShowConfirm(false);
    setTimeout(() => {
      startTour(lastStepIndexRef.current);
    }, 150);
  };

  const startTour = (stepIndex?: number | any) => {
    if (typeof window === "undefined" || !steps || steps.length === 0) return;

    if (driverRef.current) {
      driverRef.current.destroy();
    }

    const initialStep = typeof stepIndex === "number" ? stepIndex : 0;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      doneBtnText: "Finalizar",
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      steps: steps,
      onDestroyStarted: () => {
        if (!driverObj.hasNextStep()) {
          driverObj.destroy();
          localStorage.setItem(`tour_seen_${pageId}`, "true");
          setHasSeenTour(true);
        } else {
          lastStepIndexRef.current = driverObj.getActiveIndex?.() ?? 0;
          driverObj.destroy();
          setShowConfirm(true);
        }
      },
    });

    driverRef.current = driverObj;
    driverObj.drive(initialStep);
  };

  const TourExitDialog = () => (
    <ConfirmationDialog
      open={showConfirm}
      onClose={cancelExit}
      onConfirm={confirmExit}
      title="Salir del tour"
      message="¿Seguro que deseas salir del tour guiado?"
      type="info"
      confirmText="Salir"
      cancelText="Continuar tour"
    />
  );

  return { startTour, hasSeenTour, TourExitDialog };
}
