import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/admin/common";

export const Route = createFileRoute("/admin/")({ component: Page });

function Page() {
  return (
    <div>
      <PageTitle title="Dashboard" />
      <p className="text-muted-foreground">Em construção.</p>
    </div>
  );
}
