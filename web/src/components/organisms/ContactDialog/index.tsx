import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useEffect, type JSX } from "react";
import { useForm } from "react-hook-form";

import type {
  Contact,
  ContactFormData,
} from "../../../interfaces/contact.interface";

type ContactDialogProps = {
  open: boolean;
  contact: Contact;
  onClose: () => void;
  onSubmit: (name: string, phone: string) => Promise<void>;
};

export default function ContactDialog({
  open,
  contact,
  onClose,
  onSubmit,
}: Readonly<ContactDialogProps>): JSX.Element {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ContactFormData>({
    defaultValues: {
      name: contact.name ?? "",
      phone: contact.phone ?? "",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      name: contact.name ?? "",
      phone: contact.phone ?? "",
    });
  }, [open, contact, reset]);

  const isEditing = Boolean(contact.id);

  const handleFormSubmit = async ({
    name,
    phone,
  }: ContactFormData): Promise<void> => {
    await onSubmit(name.trim(), phone.trim());
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          className:
            "rounded-2xl! border! border-white/10! bg-slate-900! text-white!",
        },
      }}
    >
      <DialogTitle className="border-b! border-white/10! px-6! py-5! text-xl! font-bold! text-white!">
        {isEditing ? "Editar contato" : "Novo contato"}
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent className="px-6! py-6!">
          <div className="flex flex-col gap-4">
            <TextField
              {...register("name", {
                required: "Nome é obrigatório",
              })}
              fullWidth
              autoComplete="off"
              label="Nome"
              autoFocus
              error={Boolean(errors.name)}
              placeholder="Digite o nome"
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

            <TextField
              {...register("phone", {
                required: "Telefone é obrigatório",
              })}
              fullWidth
              label="Telefone"
              autoComplete="off"
              placeholder="Digite o telefone"
              error={Boolean(errors.phone)}
              helperText={errors.phone?.message}
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
          </div>
        </DialogContent>

        <DialogActions className="border-t! border-white/10! px-6! py-4!">
          <Button
            onClick={onClose}
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            {isSubmitting
              ? isEditing
                ? "Editando..."
                : "Salvando..."
              : isEditing
                ? "Editar"
                : "Salvar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
