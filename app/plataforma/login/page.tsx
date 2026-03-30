import { Suspense } from "react";
import { StaffLoginForm } from "./StaffLoginForm";

export default function PlataformaStaffLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
          <p className="text-sm text-slate-500">Cargando…</p>
        </div>
      }
    >
      <StaffLoginForm />
    </Suspense>
  );
}
