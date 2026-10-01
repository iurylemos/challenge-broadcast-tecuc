import type { JSX } from "react";
import { Grid } from "@mui/material";
import type { Connection } from "../../../interfaces/connection.interface";
import { MagicNumber } from "../../../interfaces/magicNumber.enum";
import ConnectionCard from "../../atoms/ConnectionCard";

type ConnectionListProps = {
  connections: Connection[];
  onEdit: (connection: Connection) => void;
  onDelete: (connection: Connection) => void;
  onOpen: (connection: Connection) => void;
};

export default function ConnectionList({
  connections,
  onEdit,
  onDelete,
  onOpen,
}: Readonly<ConnectionListProps>): JSX.Element {
  return (
    <Grid container spacing={MagicNumber.TWO}>
      {connections.map((connection) => (
        <Grid
          key={connection.id}
          size={{
            xs: MagicNumber.TWELVE,
            sm: MagicNumber.SIX,
            md: MagicNumber.FOUR,
          }}
        >
          <ConnectionCard
            connection={connection}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpen={onOpen}
          />
        </Grid>
      ))}
    </Grid>
  );
}
