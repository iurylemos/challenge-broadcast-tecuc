import {
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import type { JSX } from "react";

import type { Message } from "../../../interfaces/message.interface";
import { DateUtil } from "../../../utils/date.util";

type MessageListProps = {
  messages: Message[];
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
};

export default function MessageList({
  messages,
  onEdit,
  onDelete,
}: Readonly<MessageListProps>): JSX.Element {
  if (!messages.length) {
    return (
      <Typography color="text.secondary">
        Nenhuma mensagem encontrada.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {messages.map((message) => (
        <Card key={message.id}>
          <CardContent>
            <Stack
              sx={{
                direction: "row",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Chip
                label={message.status === "sent" ? "Enviada" : "Agendada"}
                color={message.status === "sent" ? "success" : "warning"}
              />
            </Stack>

            <Typography variant="body1">{message.message}</Typography>

            {message.scheduledAt && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Agendada para: {DateUtil.formatDate(message.scheduledAt)}
              </Typography>
            )}
          </CardContent>

          <CardActions>
            {message.status === "scheduled" && (
              <Button size="small" onClick={() => onEdit(message)}>
                Editar
              </Button>
            )}

            <Button
              size="small"
              color="error"
              onClick={() => onDelete(message)}
            >
              Excluir
            </Button>
          </CardActions>
        </Card>
      ))}
    </Stack>
  );
}
