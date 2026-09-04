import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <main className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
    <div className="max-w-md text-center">
      <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
        404
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Página não encontrada
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        A rota solicitada não existe no console administrativo.
      </p>
      <Button asChild className="mt-6">
        <Link to="/dashboard">Voltar ao dashboard</Link>
      </Button>
    </div>
  </main>
);

export default NotFound;
