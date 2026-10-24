import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/admin/common";

export const Route = createFileRoute("/admin/assinantes")({ component: Page });

function Page() {
  return (
    <div>
      <PageTitle title="Assinantes" />
      <p className="text-muted-foreground">Em construção.</p>
    </div>
  );
}
