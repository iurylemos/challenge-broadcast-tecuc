import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
} from "@mui/material";
import type { JSX } from "react";
import type { Connection } from "../../../interfaces/connection.interface";

type ConnectionCardProps = {
  connection: Connection;
  onEdit: (connection: Connection) => void;
  onDelete: (connection: Connection) => void;
  onOpen: (connection: Connection) => void;
};

export default function ConnectionCard({
  connection,
  onEdit,
  onDelete,
  onOpen,
}: Readonly<ConnectionCardProps>): JSX.Element {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{connection.name}</Typography>

        <Typography variant="body2" color="text.secondary">
          Conexão ID: {connection.id}
        </Typography>
      </CardContent>

      <CardActions>
        <Button onClick={() => onOpen(connection)}>Abrir</Button>

        <Button onClick={() => onEdit(connection)}>Editar</Button>

        <Button color="error" onClick={() => onDelete(connection)}>
          Deletar
        </Button>
      </CardActions>
    </Card>
  );
}
