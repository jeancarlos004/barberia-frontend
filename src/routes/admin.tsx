import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { invalidateBarber } from "@/lib/barber-store";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  CalendarX2,
  Clock,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Scissors,
  Settings,
  Shield,
  ShieldAlert,
  Trash2,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EstadoBadge } from "@/components/barber/EstadoBadge";
import { Logo } from "@/components/barber/Logo";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ApiError,
  bloquearCliente,
  cambiarEstado,
  cambiarRolCliente,
  crearBloqueo,
  desbloquearCliente,
  DIAS,
  eliminarBloqueo,
  eliminarCliente,
  eliminarServicio,
  formatFecha,
  formatHora,
  formatPrecio,
  guardarConfig,
  guardarHorarios,
  guardarServicio,
  logout,
  toKey,
  useBarberData,
  useCurrentUser,
  type AppointmentStatus,
  type Role,
  type Service,
} from "@/lib/barber-store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel de administración — Barberia YESIT" },
      { name: "description", content: "Gestiona turnos, servicios, horarios y bloqueos de Barberia YESIT." },
      { property: "og:title", content: "Panel de administración — Barberia YESIT" },
      { property: "og:description", content: "Dashboard de turnos, servicios, horarios y bloqueos." },
    ],
  }),
  component: Admin,
});

const estados: AppointmentStatus[] = ["pendiente", "confirmado", "completado", "cancelado"];

type SectionId =
  | "dashboard"
  | "turnos"
  | "calendario"
  | "clientes"
  | "servicios"
  | "horarios"
  | "bloqueos"
  | "config";

const sections: { id: SectionId; label: string; icon: typeof Users }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "turnos", label: "Turnos", icon: CalendarCheck },
  { id: "calendario", label: "Calendario", icon: CalendarDays },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "servicios", label: "Servicios", icon: Scissors },
  { id: "horarios", label: "Horarios", icon: Clock },
  { id: "bloqueos", label: "Bloqueos", icon: XCircle },
  { id: "config", label: "Configuración", icon: Settings },
];

function Admin() {
  const user = useCurrentUser();
  const db = useBarberData(user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<SectionId>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selected, setSelected] = useState<Date>(new Date());

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && (!user || user.role !== "admin")) navigate({ to: "/auth", replace: true });
  }, [mounted, user, navigate]);

  if (!mounted || !user || user.role !== "admin") return null;

  const fechaSel = toKey(selected);
  const hoy = toKey(new Date());
  const deHoy = db.appointments.filter((a) => a.fecha === (selected ? fechaSel : hoy));
  const titulo = sections.find((s) => s.id === section)!.label;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {sections.map((s) => {
            const active = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                }`}
              >
                <s.icon className="size-4" />
                {s.label}
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => {
            logout();
            queryClient.clear();
            navigate({ to: "/", replace: true });
          }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-destructive"
        >
          <LogOut className="size-4" /> Cerrar sesión
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Topbar */}
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 px-4 py-3 sm:px-5 sm:py-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú de administración">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[min(86vw,20rem)] flex-col border-sidebar-border bg-sidebar p-4">
              <SheetHeader className="border-b border-sidebar-border px-1 pb-4 text-left">
                <SheetTitle className="sr-only">Menú de administración</SheetTitle>
                <Logo />
              </SheetHeader>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto py-4">
                {sections.map((s) => {
                  const active = section === s.id;
                  return (
                    <SheetClose asChild key={s.id}>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setSection(s.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`h-11 w-full justify-start gap-3 px-3 ${
                          active ? "bg-sidebar-accent text-primary" : "text-muted-foreground"
                        }`}
                      >
                        <s.icon className="size-5" />
                        {s.label}
                      </Button>
                    </SheetClose>
                  );
                })}
              </nav>
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    logout();
                    queryClient.clear();
                    navigate({ to: "/", replace: true });
                  }}
                  className="h-11 w-full justify-start gap-3 px-3 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="size-5" /> Cerrar sesión
                </Button>
              </SheetClose>
            </SheetContent>
          </Sheet>
          <h1 className="min-w-0 truncate font-display text-xl uppercase sm:text-2xl">{titulo}</h1>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Bell className="size-5 text-muted-foreground" />
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-secondary font-display text-primary">
                {user.nombre.charAt(0)}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm">{user.nombre}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-5">
          {section === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <Stat icon={Users} tone="primary" label="Turnos hoy" value={deHoy.length} />
                <Stat
                  icon={CalendarCheck}
                  tone="success"
                  label="Confirmados"
                  value={deHoy.filter((a) => a.estado === "confirmado").length}
                />
                <Stat
                  icon={Clock}
                  tone="warning"
                  label="Pendientes"
                  value={deHoy.filter((a) => a.estado === "pendiente").length}
                />
                <Stat
                  icon={CalendarX2}
                  tone="destructive"
                  label="Cancelados"
                  value={deHoy.filter((a) => a.estado === "cancelado").length}
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <section className="surface-elite min-w-0 rounded-xl p-4 sm:p-5">
                  <h2 className="font-display text-lg uppercase">Turnos de {selected ? formatFecha(fechaSel) : "hoy"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{selected ? formatFecha(fechaSel) : formatFecha(hoy)}</p>
                  <div className="mt-4">
                    <TurnosTable fecha={selected ? fechaSel : hoy} compact />
                  </div>
                  <Button variant="outline" className="mt-5 w-full sm:w-auto" onClick={() => setSection("turnos")}>
                    Ver todos los turnos
                  </Button>
                </section>

                <div className="space-y-5">
                  <section className="surface-elite overflow-hidden rounded-xl p-3 sm:p-4">
                    <h2 className="font-display text-lg uppercase">Calendario</h2>
                    <Calendar
                      mode="single"
                      selected={selected}
                      onSelect={(d) => d && setSelected(d)}
                      className="mt-2"
                    />
                  </section>
                  <section className="surface-elite rounded-xl p-5">
                    <h2 className="font-display text-lg uppercase">Bloqueos próximos</h2>
                    <div className="mt-3 space-y-3">
                      {db.blocks
                        .filter((b) => b.fecha >= hoy)
                        .sort((a, b) => a.fecha.localeCompare(b.fecha))
                        .slice(0, 4)
                        .map((b) => (
                          <div key={b.id} className="rounded-lg border border-border px-3 py-2">
                            <p className="text-sm">{formatFecha(b.fecha)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatHora(b.desde)} - {formatHora(b.hasta)}
                            </p>
                            <p className="text-xs text-muted-foreground">{b.motivo || "Sin motivo"}</p>
                          </div>
                        ))}
                      {db.blocks.filter((b) => b.fecha >= hoy).length === 0 && (
                        <p className="text-sm text-muted-foreground">Sin bloqueos próximos.</p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {section === "turnos" && (
            <div className="surface-elite rounded-xl p-3 sm:p-5">
              <TurnosTable />
            </div>
          )}

          {section === "calendario" && (
            <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
              <div className="surface-elite overflow-hidden rounded-xl p-3 sm:p-4">
                <Calendar mode="single" selected={selected} onSelect={(d) => d && setSelected(d)} />
              </div>
              <div className="surface-elite min-w-0 rounded-xl p-3 sm:p-5">
                <h2 className="font-display text-lg uppercase">{formatFecha(fechaSel)}</h2>
                <div className="mt-4">
                  <TurnosTable fecha={fechaSel} />
                </div>
              </div>
            </div>
          )}

          {section === "clientes" && <ClientesPanel />}
          {section === "servicios" && <ServiciosPanel />}
          {section === "horarios" && <HorariosPanel />}
          {section === "bloqueos" && <BloqueosPanel />}
          {section === "config" && <ConfigPanel />}
        </main>
      </div>
    </div>
  );
}

const tones = {
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
} as const;

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: keyof typeof tones;
}) {
  return (
    <div className="surface-elite min-w-0 flex-col items-start gap-3 rounded-xl p-4 sm:flex sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg sm:size-11 ${tones[tone]}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-2xl">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function TurnosTable({ fecha, compact }: { fecha?: string; compact?: boolean }) {
  const user = useCurrentUser();
  const db = useBarberData(user);
  const queryClient = useQueryClient();
  const rows = useMemo(
    () =>
      db.appointments
        .filter((a) => (fecha ? a.fecha === fecha : true))
        .sort((a, b) =>
          fecha ? a.hora.localeCompare(b.hora) : (b.fecha + b.hora).localeCompare(a.fecha + a.hora),
        ),
    [db.appointments, fecha],
  );

  const onEstado = async (id: string, estado: AppointmentStatus) => {
    try {
      await cambiarEstado(id, estado);
      await invalidateBarber(queryClient);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
    }
  };

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((a) => (
          <article key={a.id} className="rounded-lg border border-border bg-background/30 p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{a.clienteNombre}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fecha ? formatHora(a.hora) : `${formatFecha(a.fecha)} · ${formatHora(a.hora)}`}
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {db.services.find((s) => s.id === a.serviceId)?.nombre ?? a.servicioNombre ?? "—"}
                </p>
              </div>
              <EstadoBadge estado={a.estado} />
            </div>
            {!compact && (
              <Select value={a.estado} onValueChange={(v) => onEstado(a.id, v as AppointmentStatus)}>
                <SelectTrigger className="mt-4 w-full" aria-label={`Cambiar estado de ${a.clienteNombre}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </article>
        ))}
        {rows.length === 0 && <p className="py-5 text-center text-sm text-muted-foreground">No hay turnos para mostrar</p>}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-left text-muted-foreground">
          <tr>
            {!fecha && <th className="px-4 py-3 font-normal">Fecha</th>}
            <th className="px-4 py-3 font-normal">Hora</th>
            <th className="px-4 py-3 font-normal">Cliente</th>
            <th className="px-4 py-3 font-normal">Servicio</th>
            <th className="px-4 py-3 font-normal">Estado</th>
            {!compact && <th className="px-4 py-3 font-normal">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-t border-border/60">
              {!fecha && <td className="px-4 py-3">{a.fecha}</td>}
              <td className="px-4 py-3">{formatHora(a.hora)}</td>
              <td className="px-4 py-3">{a.clienteNombre}</td>
              <td className="px-4 py-3">{db.services.find((s) => s.id === a.serviceId)?.nombre ?? a.servicioNombre ?? "—"}</td>
              <td className="px-4 py-3">
                <EstadoBadge estado={a.estado} />
              </td>
              {!compact && (
                <td className="px-4 py-3">
                  <Select value={a.estado} onValueChange={(v) => onEstado(a.id, v as AppointmentStatus)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                No hay turnos para mostrar
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </>
  );
}

function ClientesPanel() {
  const user = useCurrentUser();
  const db = useBarberData(user);
  const queryClient = useQueryClient();
  const clientes = db.users.filter((u) => u.role === "cliente");

  const handleEliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al cliente ${nombre}?`)) return;
    try {
      await eliminarCliente(id);
      await invalidateBarber(queryClient);
      toast.success("Cliente eliminado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar el cliente");
    }
  };

  const handleBloquear = async (id: string, nombre: string) => {
    try {
      await bloquearCliente(id);
      await invalidateBarber(queryClient);
      toast.success("Cliente bloqueado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo bloquear el cliente");
    }
  };

  const handleDesbloquear = async (id: string, nombre: string) => {
    try {
      await desbloquearCliente(id);
      await invalidateBarber(queryClient);
      toast.success("Cliente desbloqueado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo desbloquear el cliente");
    }
  };

  const handleCambiarRol = async (id: string, nuevoRol: Role) => {
    try {
      await cambiarRolCliente(id, nuevoRol);
      await invalidateBarber(queryClient);
      toast.success(`Rol cambiado a ${nuevoRol}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el rol");
    }
  };

  return (
    <>
      <div className="space-y-3 md:hidden">
        {clientes.map((c) => (
          <article key={c.id} className="rounded-xl border border-border p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
              <div className="min-w-0">
                <p className="font-medium">{c.nombre}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">{c.email}</p>
                <p className="text-sm text-muted-foreground">{c.telefono}</p>
              </div>
              <span className="text-sm text-primary">{db.appointments.filter((a) => a.userId === c.id).length} turnos</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleBloquear(c.id, c.nombre)}
              >
                <ShieldAlert className="size-4" /> Bloquear
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleEliminar(c.id, c.nombre)}
              >
                <Trash2 className="size-4 text-destructive" /> Eliminar
              </Button>
            </div>
          </article>
        ))}
        {clientes.length === 0 && <p className="py-5 text-center text-sm text-muted-foreground">Aún no hay clientes registrados</p>}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-normal">Cliente</th>
            <th className="px-4 py-3 font-normal">Correo</th>
            <th className="px-4 py-3 font-normal">Teléfono</th>
            <th className="px-4 py-3 font-normal">Turnos</th>
            <th className="px-4 py-3 font-normal">Estado</th>
            <th className="px-4 py-3 font-normal">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id} className="border-t border-border/60">
              <td className="px-4 py-3">{c.nombre}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.telefono}</td>
              <td className="px-4 py-3">{db.appointments.filter((a) => a.userId === c.id).length}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  c.is_active !== false ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                }`}>
                  {c.is_active !== false ? "Activo" : "Bloqueado"}
                </span>
              </td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleCambiarRol(c.id, "admin")}>
                      <UserCog className="size-4" /> Hacer Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {c.is_active !== false ? (
                      <DropdownMenuItem onClick={() => handleBloquear(c.id, c.nombre)}>
                        <ShieldAlert className="size-4" /> Bloquear
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleDesbloquear(c.id, c.nombre)}>
                        <Shield className="size-4" /> Desbloquear
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleEliminar(c.id, c.nombre)} className="text-destructive">
                      <Trash2 className="size-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
          {clientes.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                Aún no hay clientes registrados
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </>
  );
}

function HorariosPanel() {
  const user = useCurrentUser();
  const db = useBarberData(user);
  const queryClient = useQueryClient();

  const save = async (dia: number, patch: Partial<(typeof db.schedules)[number]>) => {
    const next = db.schedules.map((s) => (s.dia === dia ? { ...s, ...patch } : s));
    if (next.length !== 7) return;
    try {
      await guardarHorarios(next);
      await invalidateBarber(queryClient);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudieron guardar los horarios");
    }
  };

  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
        const h = db.schedules.find((s) => s.dia === d);
        if (!h) return null;
        return (
          <div key={d} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border px-4 py-3 sm:flex sm:flex-wrap sm:gap-4">
            <span className="min-w-0 sm:w-28">{DIAS[d]}</span>
            <Switch checked={h.abierto} onCheckedChange={(v) => save(d, { abierto: v })} />
            <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:contents">
              <Input type="time" value={h.desde} onChange={(e) => save(d, { desde: e.target.value })} className="min-w-0 sm:w-32" />
              <span className="text-muted-foreground">a</span>
              <Input type="time" value={h.hasta} onChange={(e) => save(d, { hasta: e.target.value })} className="min-w-0 sm:w-32" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ServiciosPanel() {
  const user = useCurrentUser();
  const db = useBarberData(user);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ nombre: "", duracion: 30, precio: 20000 });

  const reset = () => {
    setEditing(null);
    setForm({ nombre: "", duracion: 30, precio: 20000 });
  };

  return (
    <div className="space-y-6">
      <form
        className="surface-elite grid gap-3 rounded-xl p-4 sm:flex sm:flex-wrap sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const payload: Omit<Service, "id"> & { id?: string } = {
              nombre: form.nombre,
              duracion: Number(form.duracion),
              precio: Number(form.precio),
              activo: editing?.activo ?? true,
              icono: editing?.icono ?? "scissors",
            };
            if (editing?.id) {
              payload.id = editing.id;
            }
            await guardarServicio(payload);
            await invalidateBarber(queryClient);
            toast.success(editing ? "Servicio actualizado" : "Servicio creado");
            reset();
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el servicio");
          }
        }}
      >
        <div className="space-y-1.5 sm:flex-1">
          <Label>Nombre</Label>
          <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Duración (min)</Label>
          <Input
            type="number"
            min={10}
            step={5}
            className="w-full sm:w-32"
            value={form.duracion}
            onChange={(e) => setForm({ ...form, duracion: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Precio</Label>
          <Input
            type="number"
            min={0}
            step={1000}
            className="w-full sm:w-36"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
          />
        </div>
        <Button type="submit" className="w-full sm:w-auto">
          {editing ? (
            <>
              <Pencil className="size-4" /> Guardar cambios
            </>
          ) : (
            <>
              <Plus className="size-4" /> Agregar
            </>
          )}
        </Button>
        {editing && (
            <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={reset}>
            Cancelar
          </Button>
        )}
      </form>

      <div className="space-y-3">
        {db.services.map((s) => (
          <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl border border-border px-4 py-3 sm:flex sm:flex-wrap sm:gap-4">
            <span className="min-w-0 font-display sm:flex-1">{s.nombre}</span>
            <span className="text-sm text-muted-foreground">{s.duracion} min</span>
            <span className="text-primary">{formatPrecio(s.precio)}</span>
            <div className="col-span-3 flex items-center gap-2 sm:col-span-1">
              <Switch
                checked={s.activo}
                onCheckedChange={async (v) => {
                  try {
                    await guardarServicio({ ...s, activo: v });
                    await invalidateBarber(queryClient);
                  } catch (err) {
                    toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar");
                  }
                }}
              />
              <span className="text-xs text-muted-foreground">{s.activo ? "Activo" : "Inactivo"}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditing(s);
                setForm({ nombre: s.nombre, duracion: s.duracion, precio: s.precio });
              }}
              aria-label="Editar servicio"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                try {
                  await eliminarServicio(s.id);
                  await invalidateBarber(queryClient);
                  toast.success("Servicio eliminado");
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar");
                }
              }}
              aria-label="Eliminar servicio"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BloqueosPanel() {
  const user = useCurrentUser();
  const db = useBarberData(user);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ fecha: toKey(new Date()), desde: "14:00", hasta: "16:00", motivo: "" });

  return (
    <div className="space-y-6">
      <form
        className="surface-elite grid gap-3 rounded-xl p-4 sm:flex sm:flex-wrap sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await crearBloqueo(form);
            await invalidateBarber(queryClient);
            setForm({ ...form, motivo: "" });
            toast.success("Bloqueo creado");
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "No se pudo crear el bloqueo");
          }
        }}
      >
        <div className="space-y-1.5">
          <Label>Fecha</Label>
          <Input
            type="date"
            required
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Desde</Label>
          <Input
            type="time"
            className="w-full sm:w-32"
            value={form.desde}
            onChange={(e) => setForm({ ...form, desde: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Hasta</Label>
          <Input
            type="time"
            className="w-full sm:w-32"
            value={form.hasta}
            onChange={(e) => setForm({ ...form, hasta: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Motivo</Label>
          <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
        </div>
        <Button type="submit" className="w-full sm:w-auto">
          <Plus className="size-4" /> Bloquear
        </Button>
      </form>

      <div className="space-y-3">
        {db.blocks.map((b) => (
          <div key={b.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-xl border border-border px-4 py-3 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
            <span className="min-w-0 sm:flex-1">{formatFecha(b.fecha)}</span>
            <span className="text-sm text-muted-foreground">
              {formatHora(b.desde)} - {formatHora(b.hasta)}
            </span>
            <span className="col-span-2 text-sm text-muted-foreground sm:col-span-1">{b.motivo || "Sin motivo"}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                try {
                  await eliminarBloqueo(b.id);
                  await invalidateBarber(queryClient);
                  toast.success("Bloqueo eliminado");
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar");
                }
              }}
              aria-label="Eliminar bloqueo"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
        {db.blocks.length === 0 && <p className="text-sm text-muted-foreground">No hay bloqueos registrados.</p>}
      </div>
    </div>
  );
}

function ConfigPanel() {
  const user = useCurrentUser();
  const db = useBarberData(user);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(db.settings);

  useEffect(() => {
    setForm(db.settings);
  }, [db.settings]);

  return (
    <form
      className="surface-elite max-w-xl space-y-4 rounded-xl p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await guardarConfig(form);
          await invalidateBarber(queryClient);
          toast.success("Configuración guardada");
        } catch (err) {
          toast.error(err instanceof ApiError ? err.message : "No se pudo guardar");
        }
      }}
    >
      <p className="text-sm text-muted-foreground">
        Datos generales del negocio. Se usan en la información visible del sitio.
      </p>
      <div className="space-y-1.5">
        <Label>Nombre del negocio</Label>
        <Input
          required
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Teléfono</Label>
        <Input
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Dirección</Label>
        <Input
          value={form.direccion}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <Input
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
      </div>
      <Button type="submit">Guardar cambios</Button>
    </form>
  );
}
