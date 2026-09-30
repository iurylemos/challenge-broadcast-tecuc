import { Button } from "@mui/material";
import { FirebaseService } from "../../../services/firebase.service";
import { useContext, type JSX } from "react";
import { AuthContext } from "../../../contexts/auth/Auth.context";

export default function ConnectionsTemplate(): JSX.Element {
  const { user } = useContext(AuthContext);

  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <p>
        Logado como {user?.email} (uid: {user?.uid})
      </p>
      <Button variant="outlined" onClick={() => FirebaseService.signOut()}>
        Sair
      </Button>
    </div>
  );
}
