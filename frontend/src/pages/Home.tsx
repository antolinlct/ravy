import { Badge, Button, ButtonGroup, Card, createTheme, ThemeProvider} from "flowbite-react";
import { useState } from "react";
import api from "../lib/axiosClient";

export default function Home() {
  const [message, setMessage] = useState("Aucun test encore effectué");

  async function testBackend() {
    try {
      const response = await api.get("/health");
      setMessage(`Réponse backend : ${response.data.message}`);
    } catch (error) {
      console.error("Erreur Axios :", error);
      setMessage("Connexion au backend impossible (normal pour l’instant)");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="max-w-md w-full flex flex-col items-center text-center space-y-4">
        <h1 className="text-3xl font-bold">
          Bienvenue sur ravy 👋
        </h1>

        <div className="flex items-center justify-center">
          <Button>Bouton Flowbite</Button>
        </div>

        <p className="text-gray-600">{message}</p>

        <Button className="w-full" onClick={testBackend}>
          Tester la connexion backend
        </Button>
      </Card>
    </div>
  );
}
