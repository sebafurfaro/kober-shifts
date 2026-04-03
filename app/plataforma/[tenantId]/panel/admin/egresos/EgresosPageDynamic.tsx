"use client";

import dynamic from "next/dynamic";
import { Section } from "../../components/layout/Section";
import { useFeatureGate } from "@/lib/use-feature-gate";

const EgresosPageClient = dynamic(() => import("./EgresosPageClient"), {
  ssr: false,
  loading: () => (
    <Section>
      <div className="flex justify-center py-24 text-sm text-default-500" aria-busy="true">
        Cargando…
      </div>
    </Section>
  ),
});

export default function EgresosPageDynamic() {
  const { isLoading: featureGateLoading } = useFeatureGate("show_pagos");
  
  if (featureGateLoading) {
    return (
      <Section>
        <div className="flex justify-center py-24 text-sm text-default-500" aria-busy="true">
          Cargando…
        </div>
      </Section>
    );
  }

  return <EgresosPageClient />;
}
