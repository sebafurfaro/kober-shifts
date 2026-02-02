import { StoreHeader } from "../components/layout/Header";

export default function StoreTenantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-nodo">
      <StoreHeader />
      {children}
    </div>
  );
}
