import { StoreThemeProvider } from "./components/StoreThemeProvider";
import { StoreAuthGuard } from "./components/StoreAuthGuard";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Let client-side guard handle all authentication
  // This avoids hydration mismatches from server-side redirects
  return (
    <StoreThemeProvider>
      <StoreAuthGuard>
        {children}
      </StoreAuthGuard>
    </StoreThemeProvider>
  );
}
