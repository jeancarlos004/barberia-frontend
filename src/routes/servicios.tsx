import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";

import { SiteHeader } from "@/components/barber/SiteHeader";
import { Button } from "@/components/ui/button";
import { formatPrecio, useBarberData, useCurrentUser } from "@/lib/barber-store";

export const Route = createFileRoute("/servicios")({
  head: () => ({
    meta: [
      { title: "Servicios y precios — Barberia YESIT" },
      {
        name: "description",
        content: "Corte clásico, corte + barba, arreglo de barba y corte premium. Consulta duración y precios.",
      },
      { property: "og:title", content: "Servicios y precios — Barberia YESIT" },
      { property: "og:description", content: "Duración y precios de todos los servicios de Barberia YESIT." },
    ],
  }),
  component: Servicios,
});

function Servicios() {
  const user = useCurrentUser();
  const db = useBarberData(user);
  const servicios = db.services.filter((s) => s.activo);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <h1 className="font-display text-3xl uppercase sm:text-4xl">Servicios</h1>
        <p className="mt-2 text-muted-foreground">Precios en pesos colombianos.</p>

        <div className="mt-8 space-y-3">
          {servicios.map((s) => (
            <div
              key={s.id}
              className="surface-elite grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-4 py-4 sm:gap-4 sm:px-5"
            >
              <div className="min-w-0">
                <h2 className="font-display text-lg">{s.nombre}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-3.5" /> {s.duracion} min
                </p>
              </div>
              <div className="text-right">
                <p className="text-base text-primary sm:text-lg">{formatPrecio(s.precio)}</p>
                <Button asChild size="sm" variant="outline" className="mt-2">
                  <Link to="/reservar">Reservar</Link>
                </Button>
              </div>
            </div>
          ))}
          {servicios.length === 0 && (
            <p className="text-muted-foreground">No hay servicios activos por el momento.</p>
          )}
        </div>
      </main>
    </div>
  );
}
