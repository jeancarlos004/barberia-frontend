import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Award, Clock, MapPin, Phone, Sparkles, Star } from "lucide-react";

import heroImg from "@/assets/hero-barberia.jpg";
import { SiteHeader } from "@/components/barber/SiteHeader";
import { Button } from "@/components/ui/button";
import { useBarberData, useCurrentUser, formatPrecio, DIAS } from "@/lib/barber-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Barberia YESIT — Reserva tu turno online" },
      {
        name: "description",
        content:
          "Reserva tu turno en Barberia YESIT en segundos: corte clásico, barba y corte premium con profesionales calificados.",
      },
      { property: "og:title", content: "Barberia YESIT — Reserva tu turno online" },
      {
        property: "og:description",
        content: "Agenda cortes y barba online, consulta horarios y gestiona tus turnos desde tu cuenta.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const user = useCurrentUser();
  const db = useBarberData(user);
  const servicios = db.services.filter((s) => s.activo);
  const abiertos = db.schedules.filter((s) => s.abierto);
  const nombreNegocio = db.settings.nombre || "Barberia YESIT";

  // Build a summary of opening hours
  const horarioResumen = abiertos.length > 0
    ? `${abiertos[0]?.desde ?? ""} - ${abiertos[abiertos.length - 1]?.hasta ?? ""}`
    : "9:00 AM - 7:00 PM";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <img
            src={heroImg}
            alt="Barbero profesional realizando un corte en Barberia YESIT"
            width={1280}
            height={960}
            className="absolute inset-0 size-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/30" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24 md:py-32">
            <h1 className="max-w-xl font-display text-4xl leading-[1.05] uppercase sm:text-5xl md:text-6xl">
              Tu mejor <span className="block text-gold">versión</span> comienza aquí
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              Reserva tu turno en segundos y disfruta de la experiencia {nombreNegocio}.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link to="/reservar">
                Reservar mi turno <ArrowRight className="size-4" />
              </Link>
            </Button>

            <div className="mt-10 grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:gap-8">
              {[
                { icon: Award, t: "Profesionales", s: "Calificados" },
                { icon: Star, t: "Productos", s: "Premium" },
                { icon: Sparkles, t: "Ambiente", s: "Único" },
              ].map((f) => (
                <div key={f.t} className="flex items-center gap-3">
                  <f.icon className="size-5 text-primary" />
                  <span className="min-w-0 text-xs leading-tight sm:text-sm">
                    {f.t}
                    <span className="block text-muted-foreground">{f.s}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/40">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:grid-cols-3">
            <Info icon={Clock} title="Horario" text={horarioResumen} />
            <Info icon={MapPin} title="Dirección" text={db.settings.direccion || "Dirección"} />
            <Info icon={Phone} title={db.settings.telefono || "Teléfono"} text="WhatsApp" />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h2 className="font-display text-3xl uppercase">Nuestros servicios</h2>
          <p className="mt-2 text-muted-foreground">Elige el servicio que deseas y reserva en línea.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {servicios.length > 0 ? (
              servicios.slice(0, 4).map((servicio) => (
                <div key={servicio.id} className="surface-elite rounded-xl p-5">
                  <h3 className="font-display text-lg">{servicio.nombre}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{servicio.duracion} min</p>
                  <p className="mt-4 text-xl text-primary">{formatPrecio(servicio.precio)}</p>
                </div>
              ))
            ) : (
              // Fallback services if API fails
              <>
                <div className="surface-elite rounded-xl p-5">
                  <h3 className="font-display text-lg">Corte Clásico</h3>
                  <p className="mt-1 text-sm text-muted-foreground">30 min</p>
                  <p className="mt-4 text-xl text-primary">$20,000</p>
                </div>
                <div className="surface-elite rounded-xl p-5">
                  <h3 className="font-display text-lg">Barba</h3>
                  <p className="mt-1 text-sm text-muted-foreground">20 min</p>
                  <p className="mt-4 text-xl text-primary">$15,000</p>
                </div>
                <div className="surface-elite rounded-xl p-5">
                  <h3 className="font-display text-lg">Corte + Barba</h3>
                  <p className="mt-1 text-sm text-muted-foreground">45 min</p>
                  <p className="mt-4 text-xl text-primary">$30,000</p>
                </div>
                <div className="surface-elite rounded-xl p-5">
                  <h3 className="font-display text-lg">Corte Premium</h3>
                  <p className="mt-1 text-sm text-muted-foreground">60 min</p>
                  <p className="mt-4 text-xl text-primary">$40,000</p>
                </div>
              </>
            )}
          </div>
          <Button asChild variant="outline" className="mt-8">
            <Link to="/servicios">Ver todos los servicios</Link>
          </Button>
        </section>

        <section className="border-t border-border/60 bg-card/30">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="font-display text-3xl uppercase">Horarios de atención</h2>
            <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {db.schedules.length > 0 ? (
                db.schedules.map((schedule) => (
                  <div key={schedule.dia} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 text-sm">
                    <span>{DIAS[schedule.dia]}</span>
                    {schedule.abierto ? (
                      <span className="text-primary">{schedule.desde} - {schedule.hasta}</span>
                    ) : (
                      <span className="text-muted-foreground">Cerrado</span>
                    )}
                  </div>
                ))
              ) : (
                // Fallback schedule if API fails
                <>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 text-sm">
                    <span>Lunes</span>
                    <span className="text-primary">9:00 AM - 7:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 text-sm">
                    <span>Martes</span>
                    <span className="text-primary">9:00 AM - 7:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 text-sm">
                    <span>Miércoles</span>
                    <span className="text-primary">9:00 AM - 7:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 text-sm">
                    <span>Jueves</span>
                    <span className="text-primary">9:00 AM - 7:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 text-sm">
                    <span>Viernes</span>
                    <span className="text-primary">9:00 AM - 7:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 text-sm">
                    <span>Sábado</span>
                    <span className="text-primary">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 text-sm">
                    <span>Domingo</span>
                    <span className="text-muted-foreground">Cerrado</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {nombreNegocio}
      </footer>
    </div>
  );
}

function Info({ icon: Icon, title, text }: { icon: typeof Clock; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-5 text-primary" />
      <span className="text-sm leading-tight">
        {title}
        <span className="block text-muted-foreground">{text}</span>
      </span>
    </div>
  );
}
