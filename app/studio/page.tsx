// Server Component — AppShell wraps the Client Component
import AppShell from "@/components/layout/AppShell";
import StudioCatalogClient from "./StudioCatalogClient";

export default function StudioPage() {
  return (
    <AppShell>
      <StudioCatalogClient />
    </AppShell>
  );
}