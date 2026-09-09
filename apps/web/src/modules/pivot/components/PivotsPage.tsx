import { Plus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { hasAccess } from "@/modules/auth/access";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { DeletePivotDialog } from "@/modules/pivot/components/DeletePivotDialog";
import { PivotCard } from "@/modules/pivot/components/PivotCard";
import { usePivotState } from "@/modules/pivot/hooks/use-pivot-state";
import { usePivotsQuery } from "@/modules/pivot/hooks/use-pivots";
import type { Pivot } from "@/modules/pivot/schemas/pivot.schemas";
import {
  SectionEmpty,
  SectionError,
  SectionLoading,
} from "@/shared/components/states/QueryState";

const TITLE = "Pivôs";

// Cada cartão busca o próprio estado (GET /v1/pivots/{id}/state); sem o
// endpoint, o cartão fica com "—".
const PivotListCard = (
  props: Omit<Parameters<typeof PivotCard>[0], "state">,
) => {
  const state = usePivotState(props.pivot.id, { refetchInterval: 30_000 });
  return <PivotCard {...props} state={state} />;
};

export const PivotsPage = () => {
  const query = usePivotsQuery();
  const permissions = useAuthStore((state) => state.permissions);
  const canWrite = hasAccess(permissions, "pivot.write");
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState<Pivot | null>(null);

  // Cadastro e edição têm tela própria (/pivos/novo e /pivos/:id/editar).
  const openEdit = (pivot: Pivot) => navigate(`/pivos/${pivot.id}/editar`);

  if (query.isLoading) {
    return (
      <AppShell title={TITLE}>
        <SectionLoading lines={5} screen variant="list" />
      </AppShell>
    );
  }

  if (query.isError || !query.data) {
    return (
      <AppShell title={TITLE}>
        <SectionError
          message="Não foi possível carregar os pivôs."
          onRetry={() => void query.refetch()}
        />
      </AppShell>
    );
  }

  const { items, total } = query.data;

  return (
    <AppShell title={TITLE}>
      <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] lg:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
              Seus pivôs
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecione um pivô para ver estado, posição e comandos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              {total} {total === 1 ? "pivô" : "pivôs"}
            </span>
            {canWrite ? (
              <Button asChild className="h-10 rounded-xl px-4 text-sm">
                <Link to="/pivos/novo">
                  <Plus className="h-4 w-4" />
                  Novo pivô
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <SectionEmpty
          title="Nenhum pivô cadastrado"
          description={
            canWrite
              ? 'Use "Novo pivô" para cadastrar o primeiro pivô deste tenant.'
              : "Ainda não há pivôs cadastrados neste tenant."
          }
        />
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((pivot) => (
            <PivotListCard
              key={pivot.id}
              pivot={pivot}
              canWrite={canWrite}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          ))}
        </section>
      )}

      {canWrite ? (
        <DeletePivotDialog
          pivot={deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(null);
          }}
        />
      ) : null}
    </AppShell>
  );
};
