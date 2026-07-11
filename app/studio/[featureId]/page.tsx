// Server Component — wraps the Client Component with AppShell (server-only layout)
import AppShell from "@/components/layout/AppShell";
import StudioWorkspaceClient from "./StudioWorkspaceClient";

export default function StudioWorkspacePage() {
  return (
    <AppShell>
      <StudioWorkspaceClient />
    </AppShell>
  );
}
