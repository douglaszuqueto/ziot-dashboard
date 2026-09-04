import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeletePivotMutation } from "@/modules/pivot/hooks/use-pivots";
import type { Pivot } from "@/modules/pivot/schemas/pivot.schemas";
import { translateApiError } from "@/shared/api/error-messages";

export const DeletePivotDialog = ({
  pivot,
  onOpenChange,
  onDeleted,
}: {
  pivot: Pivot | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: (pivot: Pivot) => void;
}) => {
  const deleteMutation = useDeletePivotMutation();

  const confirm = async () => {
    if (!pivot) return;

    try {
      await deleteMutation.mutateAsync(pivot.id);
      toast.success("Pivô excluído.");
      onOpenChange(false);
      onDeleted?.(pivot);
    } catch (error) {
      toast.error(translateApiError(error, "Não foi possível excluir o pivô."));
    }
  };

  return (
    <AlertDialog
      open={Boolean(pivot)}
      onOpenChange={deleteMutation.isPending ? undefined : onOpenChange}
    >
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir pivô?</AlertDialogTitle>
          <AlertDialogDescription>
            {pivot ? (
              <>
                <span className="font-semibold text-foreground">
                  {pivot.name}
                </span>{" "}
                será removido deste tenant. Esta ação não pode ser desfeita.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-xl"
            disabled={deleteMutation.isPending}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl bg-alert text-white hover:bg-alert/90"
            disabled={deleteMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              void confirm();
            }}
          >
            {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
