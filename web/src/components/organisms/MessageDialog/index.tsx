import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  TextField,
} from "@mui/material";
import { useEffect, type JSX } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { Contact } from "../../../interfaces/contact.interface";
import type { Message } from "../../../interfaces/message.interface";
import {
  messageSchema,
  type MessageInput,
} from "../../../schemas/message.schema";

type MessageDialogProps = {
  open: boolean;
  contacts: Contact[];
  message: Message | null;
  onClose: () => void;
  onSubmit: (
    contactIds: string[],
    content: string,
    scheduledAt?: string,
  ) => Promise<void>;
};

export default function MessageDialog({
  open,
  contacts,
  message,
  onClose,
  onSubmit,
}: Readonly<MessageDialogProps>): JSX.Element {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MessageInput>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      contactIds: [],
      content: "",
      scheduled: false,
      scheduledAt: "",
    },
  });

  const selectedContactIds = useWatch({
    control,
    name: "contactIds",
  });

  const scheduled = useWatch({
    control,
    name: "scheduled",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      contactIds: message?.contactIds ?? [],
      content: message?.message ?? "",
      scheduled: Boolean(message?.scheduledAt),
      scheduledAt: message?.scheduledAt ?? "",
    });
  }, [open, message, reset]);

  const toggleContact = (id: string): void => {
    const current = selectedContactIds ?? [];

    setValue(
      "contactIds",
      current.includes(id)
        ? current.filter((contactId) => contactId !== id)
        : [...current, id],
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    );
  };

  const handleFormSubmit = async (data: MessageInput): Promise<void> => {
    await onSubmit(
      data.contactIds,
      data.content.trim(),
      data.scheduled ? data.scheduledAt : undefined,
    );
  };

  const isEditing = Boolean(message);

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
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle className="border-b! border-white/10! px-6! py-5! text-xl! font-bold! text-white!">
          {isEditing ? "Editar mensagem" : "Nova mensagem"}
        </DialogTitle>

        <DialogContent className="px-6! py-6!">
          <div className="flex flex-col gap-6">
            <section>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-white">Contatos</h3>

                <p className="mt-1 text-xs text-slate-400">
                  Selecione os contatos que receberão a mensagem.
                </p>
              </div>

              <div className="max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/50">
                <FormGroup className="p-2!">
                  {contacts.map((contact) => {
                    const checked = selectedContactIds.includes(contact.id);

                    return (
                      <FormControlLabel
                        key={contact.id}
                        control={
                          <Checkbox
                            checked={checked}
                            onChange={() => toggleContact(contact.id)}
                            sx={{
                              color: "rgba(255,255,255,0.3)",
                              "&.Mui-checked": {
                                color: "#8b5cf6",
                              },
                            }}
                          />
                        }
                        label={
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-200">
                              {contact.name}
                            </span>

                            <span className="text-xs text-slate-500">
                              {contact.phone}
                            </span>
                          </div>
                        }
                        className="mx-0! rounded-lg! px-2! py-1! transition-colors hover:bg-white/5!"
                      />
                    );
                  })}
                </FormGroup>
              </div>

              {errors.contactIds && (
                <p className="mt-2 text-xs text-red-400">
                  {errors.contactIds.message}
                </p>
              )}
            </section>

            <section>
              <TextField
                {...register("content")}
                fullWidth
                multiline
                minRows={5}
                autoComplete="off"
                label="Mensagem"
                placeholder="Digite a mensagem que será enviada..."
                error={Boolean(errors.content)}
                helperText={errors.content?.message}
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
            </section>

            <section className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <FormControlLabel
                control={
                  <Checkbox
                    {...register("scheduled")}
                    checked={scheduled}
                    onChange={(event) =>
                      setValue("scheduled", event.target.checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    sx={{
                      color: "rgba(255,255,255,0.3)",
                      "&.Mui-checked": {
                        color: "#8b5cf6",
                      },
                    }}
                  />
                }
                label={
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Agendar mensagem
                    </p>

                    <p className="text-xs text-slate-500">
                      Escolha quando a mensagem deverá ser enviada.
                    </p>
                  </div>
                }
              />

              {scheduled && (
                <div className="mt-3">
                  <TextField
                    {...register("scheduledAt")}
                    fullWidth
                    type="datetime-local"
                    label="Data e horário"
                    autoComplete="off"
                    error={Boolean(errors.scheduledAt)}
                    helperText={errors.scheduledAt?.message}
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
              )}
            </section>
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
              ? "Salvando..."
              : scheduled
                ? "Agendar"
                : isEditing
                  ? "Salvar alterações"
                  : "Enviar agora"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
