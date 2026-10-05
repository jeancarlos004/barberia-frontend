import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Check, ChevronLeft, Clock, Crown, Scissors, Tag, Timer, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/barber/SiteHeader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  crearTurno,
  formatFecha,
  formatHora,
  formatPrecio,
  toKey,
  useBarberData,
  useCurrentUser,
  useDisponibilidad,
} from "@/lib/barber-store";

export const Route = createFileRoute("/reservar")({
  head: () => ({
    meta: [
      { title: "Reservar turno — Barberia YESIT" },
      {
        name: "description",
        content: "Elige servicio, fecha y hora disponible y confirma tu turno en Barberia YESIT en menos de un minuto.",
      },
      { property: "og:title", content: "Reservar turno — Barberia YESIT" },
      { property: "og:description", content: "Agenda tu corte o barba eligiendo servicio, fecha y hora disponible." },
    ],
  }),
  component: Reservar,
});

const pasos = ["Servicio", "Fecha", "Hora", "Confirmar"];

function Reservar() {
  const user = useCurrentUser();
  const db = useBarberData(user);
  const navigate = useNavigate();

  const [paso, setPaso] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [hora, setHora] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const servicios = db.services.filter((s) => s.activo);
  const servicio = servicios.find((s) => s.id === serviceId) ?? null;
  const fechaKey = fecha ? toKey(fecha) : null;

  const { data: horasLibres = [], isFetching: loadingSlots } = useDisponibilidad(
    fechaKey,
    serviceId,
    paso === 2,
  );
  const slots = horasLibres.map((h) => ({ hora: h, disponible: true, motivo: undefined }));

  const confirmar = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para reservar");
      navigate({ to: "/auth" });
      return;
    }
    if (!servicio || !fechaKey || !hora) return;
    setBusy(true);
    try {
      await crearTurno({
        servicio: servicio.id,
        fecha: fechaKey,
        hora,
      });
      toast.success("¡Turno reservado!");
      navigate({ to: "/mis-turnos" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo reservar el turno");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-10">
        <ol className="mb-8 flex items-center gap-2">
          {pasos.map((p, i) => (
            <li key={p} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs",
                  i <= paso
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className={cn("hidden text-sm sm:inline", i === paso ? "text-foreground" : "text-muted-foreground")}>
                {p}
              </span>
              {i < pasos.length - 1 && <span className="h-px flex-1 bg-border" />}
            </li>
          ))}
        </ol>

        <div className="surface-elite rounded-xl p-4 sm:rounded-2xl sm:p-6">
          {paso === 0 && (
            <>
              <h1 className="font-display text-2xl">Reserva tu turno</h1>
              <p className="mt-1 text-sm text-muted-foreground">Selecciona el servicio que deseas</p>
              <div className="mt-6 space-y-3">
                {servicios.map((s) => {
                  const Icon = s.icono === "crown" ? Crown : Scissors;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setServiceId(s.id);
                        setHora(null);
                      }}
                      className={cn(
                        "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-4 text-left transition-colors sm:gap-4 sm:px-4",
                        serviceId === s.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                      )}
                    >
                      <Icon className="size-5 text-primary" />
                      <span className="min-w-0">
                        <span className="block font-display">{s.nombre}</span>
                        <span className="block text-sm text-muted-foreground">{s.duracion} min</span>
                      </span>
                      <span className="shrink-0 text-sm text-primary sm:text-base">{formatPrecio(s.precio)}</span>
                    </button>
                  );
                })}
              </div>
              <Button className="mt-6 w-full" disabled={!servicio} onClick={() => setPaso(1)}>
                Siguiente
              </Button>
            </>
          )}

          {paso === 1 && (
            <>
              <h1 className="font-display text-2xl">Selecciona una fecha</h1>
              <div className="mt-4 flex justify-center">
                <Calendar
                  mode="single"
                  selected={fecha}
                  onSelect={(d) => {
                    setFecha(d);
                    setHora(null);
                  }}
                  disabled={{ before: new Date() }}
                  className={cn("pointer-events-auto rounded-md border border-border p-3")}
                />
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setPaso(0)}>
                  <ChevronLeft className="size-4" /> Volver
                </Button>
                <Button className="flex-1" disabled={!fecha} onClick={() => setPaso(2)}>
                  Siguiente
                </Button>
              </div>
            </>
          )}

          {paso === 2 && (
            <>
              <h1 className="font-display text-2xl">Horarios disponibles</h1>
              <p className="mt-1 text-sm text-muted-foreground">{fechaKey && formatFecha(fechaKey)}</p>
              <div className="mt-6 grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">
                {loadingSlots && <p className="text-sm text-muted-foreground">Consultando horarios…</p>}
                {slots.map((s) => (
                  <button
                    key={s.hora}
                    type="button"
                    disabled={!s.disponible}
                    onClick={() => setHora(s.hora)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors",
                      !s.disponible && "border-destructive/40 bg-destructive/10 text-destructive",
                      s.disponible && "border-success/40 bg-success/10 hover:border-primary",
                      hora === s.hora && "border-primary bg-primary/15",
                    )}
                  >
                    <span>{formatHora(s.hora)}</span>
                    <span className="text-xs">{s.disponible ? <Check className="size-4" /> : "No disponible"}</span>
                  </button>
                ))}
                {slots.length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay atención en la fecha seleccionada.</p>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setPaso(1)}>
                  <ChevronLeft className="size-4" /> Volver
                </Button>
                <Button className="flex-1" disabled={!hora} onClick={() => setPaso(3)}>
                  Siguiente
                </Button>
              </div>
            </>
          )}

          {paso === 3 && servicio && fechaKey && hora && (
            <>
              <h1 className="font-display text-2xl">Confirma tu reserva</h1>
              <dl className="mt-6 space-y-3 rounded-xl border border-border p-4 text-sm">
                <Row icon={Scissors} label="Servicio" value={servicio.nombre} />
                <Row icon={CalendarDays} label="Fecha" value={formatFecha(fechaKey)} />
                <Row icon={Clock} label="Hora" value={formatHora(hora)} />
                <Row icon={Timer} label="Duración" value={`${servicio.duracion} minutos`} />
                <Row icon={Tag} label="Precio" value={formatPrecio(servicio.precio)} />
                <Row icon={User} label="Cliente" value={user ? user.nombre : "Inicia sesión para continuar"} />
              </dl>
              {!user && (
                <p className="mt-4 text-sm text-muted-foreground">
                  ¿Aún no tienes cuenta?{" "}
                  <Link to="/auth" className="text-primary underline">
                    Regístrate o inicia sesión
                  </Link>
                  .
                </p>
              )}
              <Button className="mt-6 w-full" onClick={confirmar} disabled={busy}>
                {busy ? "Confirmando…" : "Confirmar turno"}
              </Button>
              <Button variant="ghost" className="mt-2 w-full" onClick={() => setPaso(2)}>
                <ChevronLeft className="size-4" /> Volver
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 text-primary" />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd>{value}</dd>
      </div>
    </div>
  );
}
