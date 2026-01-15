"use client";

import * as React from "react";
import { useStyleConfigStore } from "@/app/store/styleConfigStore";

export function StyleConfigBootstrapper() {
  const load = useStyleConfigStore((s) => s.load);

  React.useEffect(() => {
    void load();
  }, [load]);

  return null;
}


