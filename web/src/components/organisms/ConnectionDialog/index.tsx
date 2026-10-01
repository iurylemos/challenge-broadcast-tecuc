import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { useEffect, type JSX } from "react";

import type { Connection } from "../../../interfaces/connection.interface";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  connectionSchema,
  type ConnectionFormData,
} from "../../../schemas/connection.schema";

type ConnectionDialogProps = {
  open: boolean;
  connection: Connection;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export default function ConnectionDialog({
  open,
  connection,
  onClose,
  onSubmit,
}: Readonly<ConnectionDialogProps>): JSX.Element {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      name: connection.name ?? "",
    });
  }, [open, connection, reset]);

  const isEditing = Boolean(connection.id);

  const handleFormSubmit = (data: ConnectionFormData): void => {
    console.log("handleFormSubmit", data);
    onSubmit(data.name);
  };

  const onCloseDialog = (): void => {
    reset({
      name: "",
    });

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onCloseDialog}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          className:
            "rounded-2xl! border! border-white/10! bg-slate-900! text-white!",
        },
      }}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle className="border-b! border-white/10! px-6! py-5! text-xl! font-bold! text-white!">
          {isEditing ? "Editar conexão" : "Criar conexão"}
        </DialogTitle>

        <DialogContent className="px-6! py-6!">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                autoFocus
                fullWidth
                autoComplete="off"
                label="Nome da conexão"
                placeholder="Digite o nome da conexão..."
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                sx={{
                  "& .MuiInputBase-input": {
                    color: "#fff",
                    "&::placeholder": {
                      color: "#fff",
                      opacity: 1,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#fff",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#fff",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#fff",
                  },
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "#fff",
                    },
                  "&:hover": {
                    borderColor: "#fff",
                  },
                }}
              />
            )}
          />
        </DialogContent>

        <DialogActions className="border-t! border-white/10! px-6! py-4!">
          <Button
            type="button"
            onClick={onCloseDialog}
            sx={{
              minHeight: 40,
              borderRadius: "10px",
              color: "#94a3b8",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.05)",
              },
            }}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            sx={{
              minHeight: 40,
              borderRadius: "10px",
              backgroundColor: "#7c3aed",
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#6d28d9",
                boxShadow: "none",
              },
            }}
          >
            {isEditing ? "Salvar" : "Criar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
