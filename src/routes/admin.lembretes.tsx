import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/admin/common";

export const Route = createFileRoute("/admin/lembretes")({ component: Page });

function Page() {
  return (
    <div>
      <PageTitle title="Lembretes" />
      <p className="text-muted-foreground">Em construção.</p>
    </div>
  );
}
