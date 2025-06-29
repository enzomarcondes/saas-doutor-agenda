"use client";

import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deleteService } from "@/actions/delete-service";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useServiceEdit } from "./service-edit-context";

interface TableActionsProps {
  service: {
    id: string;
    name: string;
    priceInCents: number;
  };
}

export function TableActions({ service }: TableActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { openEditDialog } = useServiceEdit();

  const deleteServiceAction = useAction(deleteService, {
    onSuccess: () => {
      toast("Serviço excluído com sucesso!", {
        style: {
          background: "#dc2626",
          color: "white",
          border: "none",
        },
      });
      setShowDeleteDialog(false);
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao excluir serviço");
    },
  });

  const handleDelete = () => {
    deleteServiceAction.execute({ id: service.id });
  };

  const handleEdit = () => {
    openEditDialog(service);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              {`Tem certeza que deseja excluir o serviço "${service.name}"? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteServiceAction.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteServiceAction.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteServiceAction.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
