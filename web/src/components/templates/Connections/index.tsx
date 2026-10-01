import { Box, Button, Container, Typography } from "@mui/material";
import { useContext, useEffect, useState, type JSX } from "react";
import type { Connection } from "../../../interfaces/connection.interface";
import type { AuthState } from "../../../interfaces/auth.interface";
import { FirebaseService } from "../../../services/firebase.service";
import { ConnectionsService } from "../../../services/connections.service";
import { AuthContext } from "../../../contexts/auth/Auth.context";
import { useNavigate } from "react-router-dom";
import { MagicNumber } from "../../../interfaces/magicNumber.enum";
import ConnectionList from "../../molecules/ConnectionList";
import ConnectionDialog from "../../organisms/ConnectionDialog";

export default function ConnectionsTemplate(): JSX.Element {
  const defaultConnection: Connection = {
    id: "",
    name: "",
  };

  const navigate = useNavigate();

  const { user } = useContext<AuthState>(AuthContext);

  const [connections, setConnections] = useState<Connection[]>([]);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const [selectedConnection, setSelectedConnection] =
    useState<Connection>(defaultConnection);

  useEffect(() => {
    if (!user) {
      return;
    }

    return ConnectionsService.subscribe(user.uid, setConnections, (error) => {
      console.error("Failed to load connections:", error);
    });
  }, [user]);

  const handleCreate = (): void => {
    setSelectedConnection(defaultConnection);
    setDialogOpen(true);
  };

  const handleEdit = (connection: Connection): void => {
    setSelectedConnection(connection);
    setDialogOpen(true);
  };

  const handleDelete = async (connection: Connection): Promise<void> => {
    try {
      await ConnectionsService.delete(connection.id);
    } catch (error) {
      console.error("Failed to delete connection:", error);
    }
  };

  const handleOpen = (connection: Connection): void => {
    navigate(`/connections/${connection.id}/contacts`);
  };

  const handleSubmit = async (name: string): Promise<void> => {
    try {
      if (selectedConnection.id) {
        await ConnectionsService.update(selectedConnection.id, name);
      } else {
        await ConnectionsService.create(name);
      }

      setDialogOpen(false);
      setSelectedConnection(defaultConnection);
    } catch (error: unknown) {
      console.error("Failed to save connection:", error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          py: MagicNumber.FOUR,
          display: "flex",
          flexDirection: "column",
          gap: MagicNumber.FOUR,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: MagicNumber.FIVE,
            borderBottomStyle: "solid",
            borderBottomColor: "black",
          }}
        >
          <Box>
            <Typography variant="h4" component="h1">
              Conexões
            </Typography>

            <Typography color="text.secondary">
              Gerencie suas conexões
            </Typography>
          </Box>

          <Button variant="contained" onClick={handleCreate}>
            Nova conexão
          </Button>
        </Box>

        <ConnectionList
          connections={connections}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpen={handleOpen}
        />

        <ConnectionDialog
          open={dialogOpen}
          connection={selectedConnection}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
        />

        <Box>
          <Typography variant="body2" color="text.secondary">
            Logado como {user?.email}
          </Typography>

          <Button
            variant="outlined"
            sx={{ mt: MagicNumber.ONE }}
            onClick={() => FirebaseService.signOut()}
          >
            Sair
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
