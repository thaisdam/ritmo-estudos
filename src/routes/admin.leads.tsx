import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/admin/common";

export const Route = createFileRoute("/admin/leads")({ component: Page });

function Page() {
  return (
    <div>
      <PageTitle title="Leads" />
      <p className="text-muted-foreground">Em construção.</p>
    </div>
  );
}
