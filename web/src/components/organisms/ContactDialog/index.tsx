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
    if (open) {
      reset({
        name: contact.name ?? "",
        phone: contact.phone ?? "",
      });
    }
  }, [open, contact, reset]);

  const isEditing = Boolean(contact.id);

  const handleFormSubmit = async ({
    name,
    phone,
  }: ContactFormData): Promise<void> => {
    await onSubmit(name.trim(), phone.trim());
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth>
      <DialogTitle>{isEditing ? "Editar contato" : "Novo contato"}</DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <TextField
            {...register("name", {
              required: "Nome é obrigatório",
            })}
            fullWidth
            label="Nome"
            margin="normal"
            autoFocus
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
          />

          <TextField
            {...register("phone", {
              required: "Telefone é obrigatório",
            })}
            fullWidth
            label="Telefone"
            margin="normal"
            placeholder="+55 11 99999-9999"
            error={Boolean(errors.phone)}
            helperText={errors.phone?.message}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>

          <Button type="submit" variant="contained" disabled={isSubmitting}>
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
