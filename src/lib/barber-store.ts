import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";

import { api, ApiError, clearTokens, getAccessToken, setTokens } from "./api";

export type Role = "cliente" | "admin";

export interface User {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  role: Role;
  is_active?: boolean;
}

export interface Service {
  id: string;
  nombre: string;
  duracion: number;
  precio: number;
  activo: boolean;
  icono: "scissors" | "beard" | "combo" | "crown";
}

export interface Schedule {
  dia: number;
  abierto: boolean;
  desde: string;
  hasta: string;
}

export interface Block {
  id: string;
  fecha: string;
  desde: string;
  hasta: string;
  motivo: string;
}

export type AppointmentStatus = "pendiente" | "confirmado" | "completado" | "cancelado";

export interface Appointment {
  id: string;
  userId: string;
  clienteNombre: string;
  serviceId: string;
  servicioNombre?: string;
  fecha: string;
  hora: string;
  estado: AppointmentStatus;
  creado: string;
}

export interface BusinessSettings {
  nombre: string;
  telefono: string;
  direccion: string;
  descripcion: string;
}

export interface Slot {
  hora: string;
  disponible: boolean;
  motivo?: string;
}

type ApiUser = {
  id: string;
  email: string;
  nombre: string;
  telefono?: string;
  rol: Role;
  is_active?: boolean;
};

type AuthPayload = {
  access: string;
  refresh: string;
  user: ApiUser;
};

const USER_KEY = "barberia-user";
const USER_UPDATE_EVENT = "barberia-user-update";

export const pad = (n: number) => String(n).padStart(2, "0");
export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (s: string) => {
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
};
export const formatFecha = (s: string) =>
  parseKey(s).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
export const formatHora = (h: string) => {
  const [hh, mm] = h.split(":").map(Number) as [number, number];
  const suf = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${pad(h12)}:${pad(mm)} ${suf}`;
};
export const formatPrecio = (n: number) => `$${Number(n).toLocaleString("es-CO")}`;
export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function hhmm(value: string) {
  return value.slice(0, 5);
}

function mapUser(raw: ApiUser): User {
  return {
    id: raw.id,
    email: raw.email,
    nombre: raw.nombre,
    telefono: raw.telefono ?? "",
    role: raw.rol,
    is_active: raw.is_active,
  };
}

function mapService(raw: {
  id: string;
  nombre: string;
  duracion: number;
  precio: string | number;
  activo: boolean;
  icono: Service["icono"];
}): Service {
  return { ...raw, precio: Number(raw.precio) };
}

function mapTurno(raw: {
  id: string;
  usuario: string;
  cliente_nombre: string;
  servicio: string;
  servicio_nombre: string;
  fecha: string;
  hora: string;
  estado: AppointmentStatus;
  creado: string;
}): Appointment {
  return {
    id: raw.id,
    userId: raw.usuario,
    clienteNombre: raw.cliente_nombre,
    serviceId: raw.servicio,
    servicioNombre: raw.servicio_nombre,
    fecha: raw.fecha,
    hora: hhmm(raw.hora),
    estado: raw.estado,
    creado: raw.creado,
  };
}

function mapBlock(raw: { id: string; fecha: string; desde: string; hasta: string; motivo: string }): Block {
  return { ...raw, desde: hhmm(raw.desde), hasta: hhmm(raw.hasta) };
}

function mapSchedule(raw: Schedule): Schedule {
  return { ...raw, desde: hhmm(raw.desde), hasta: hhmm(raw.hasta) };
}

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function persistUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
  // Dispatch custom event to notify components in the same tab
  window.dispatchEvent(new Event(USER_UPDATE_EVENT));
}

export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(readStoredUser());

    const handleUserUpdate = () => {
      setUser(readStoredUser());
    };

    // Listen for both storage events (cross-tab) and custom events (same-tab)
    window.addEventListener("storage", handleUserUpdate);
    window.addEventListener(USER_UPDATE_EVENT, handleUserUpdate);
    return () => {
      window.removeEventListener("storage", handleUserUpdate);
      window.removeEventListener(USER_UPDATE_EVENT, handleUserUpdate);
    };
  }, []);

  return mounted ? user : null;
}

export function logout() {
  clearTokens();
  persistUser(null);
}

export async function login(email: string, password: string): Promise<{ ok: boolean; error?: string; user?: User }> {
  try {
    const data = await api<AuthPayload>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setTokens(data.access, data.refresh);
    const user = mapUser(data.user);
    persistUser(user);
    return { ok: true, user };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "No se pudo iniciar sesión.";
    return { ok: false, error: message };
  }
}

export async function register(input: {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
}): Promise<{ ok: boolean; error?: string; user?: User }> {
  try {
    const data = await api<AuthPayload>("/api/auth/registro/", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setTokens(data.access, data.refresh);
    const user = mapUser(data.user);
    persistUser(user);
    return { ok: true, user };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "No se pudo crear la cuenta.";
    return { ok: false, error: message };
  }
}

export async function loginWithGoogle(credential: string): Promise<{ ok: boolean; error?: string; user?: User }> {
  try {
    const data = await api<AuthPayload>("/api/auth/google/validate/", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
    setTokens(data.access, data.refresh);
    const user = mapUser(data.user);
    persistUser(user);
    return { ok: true, user };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "No se pudo iniciar sesión con Google.";
    return { ok: false, error: message };
  }
}

export async function invalidateBarber(qc: QueryClient) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ["servicios"] }),
    qc.invalidateQueries({ queryKey: ["horarios"] }),
    qc.invalidateQueries({ queryKey: ["configuracion"] }),
    qc.invalidateQueries({ queryKey: ["bloqueos"] }),
    qc.invalidateQueries({ queryKey: ["turnos"] }),
    qc.invalidateQueries({ queryKey: ["clientes"] }),
    qc.invalidateQueries({ queryKey: ["disponibilidad"] }),
  ]);
}

export function useBarberData(user: User | null) {
  const client = typeof window !== "undefined";
  const hasToken = !!getAccessToken();
  const isAdmin = user?.role === "admin";

  const servicios = useQuery({
    queryKey: ["servicios"],
    queryFn: async () => (await api<Parameters<typeof mapService>[0][]>("/api/servicios/")).map(mapService),
    enabled: client,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const horarios = useQuery({
    queryKey: ["horarios"],
    queryFn: async () => (await api<Schedule[]>("/api/horarios/")).map(mapSchedule),
    enabled: client,
    staleTime: 5 * 60 * 1000,
  });

  const settings = useQuery({
    queryKey: ["configuracion"],
    queryFn: () => api<BusinessSettings>("/api/configuracion/"),
    enabled: client,
    staleTime: 5 * 60 * 1000,
  });

  const bloqueos = useQuery({
    queryKey: ["bloqueos"],
    queryFn: async () => (await api<Parameters<typeof mapBlock>[0][]>("/api/bloqueos/")).map(mapBlock),
    enabled: client,
    staleTime: 5 * 60 * 1000,
  });

  const turnos = useQuery({
    queryKey: ["turnos"],
    queryFn: async () => (await api<Parameters<typeof mapTurno>[0][]>("/api/turnos/")).map(mapTurno),
    enabled: !!user && hasToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const clientes = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => (await api<ApiUser[]>("/api/clientes/")).map(mapUser),
    enabled: isAdmin && hasToken,
    staleTime: 5 * 60 * 1000,
  });

  return {
    services: servicios.data ?? [],
    schedules: horarios.data ?? [],
    settings: settings.data ?? {
      nombre: "BARBERIA YESIT",
      telefono: "",
      direccion: "",
      descripcion: "",
    },
    blocks: bloqueos.data ?? [],
    appointments: turnos.data ?? [],
    users: clientes.data ?? [],
    isLoading:
      servicios.isLoading ||
      horarios.isLoading ||
      settings.isLoading ||
      bloqueos.isLoading ||
      (!!user && turnos.isLoading) ||
      (isAdmin && clientes.isLoading),
  };
}

export function useDisponibilidad(fecha: string | null, servicioId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["disponibilidad", fecha, servicioId],
    queryFn: () => api<string[]>(`/api/disponibilidad/?fecha=${fecha}&servicio=${servicioId}`),
    enabled: enabled && !!fecha && !!servicioId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export async function crearTurno(input: { servicio: string; fecha: string; hora: string }) {
  const raw = await api<Parameters<typeof mapTurno>[0]>("/api/turnos/", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return mapTurno(raw);
}

export async function cambiarEstado(id: string, estado: AppointmentStatus) {
  const raw = await api<Parameters<typeof mapTurno>[0]>(`/api/turnos/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
  return mapTurno(raw);
}

export async function turnoExpress(servicioId: string) {
  const cupo = await api<{ fecha: string; hora: string }>(
    `/api/disponibilidad/siguiente/?servicio=${servicioId}`,
  );
  return crearTurno({ servicio: servicioId, fecha: cupo.fecha, hora: cupo.hora });
}

export async function guardarServicio(service: Omit<Service, "id"> & { id?: string }) {
  if (service.id) {
    return mapService(
      await api<Parameters<typeof mapService>[0]>(`/api/servicios/${service.id}/`, {
        method: "PATCH",
        body: JSON.stringify(service),
      }),
    );
  }
  const payload = {
    nombre: service.nombre,
    duracion: service.duracion,
    precio: service.precio,
    activo: service.activo,
    icono: service.icono,
  };
  return mapService(
    await api<Parameters<typeof mapService>[0]>("/api/servicios/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export async function eliminarServicio(id: string) {
  await api(`/api/servicios/${id}/`, { method: "DELETE" });
}

export async function guardarHorarios(horarios: Schedule[]) {
  await api("/api/horarios/", {
    method: "PUT",
    body: JSON.stringify(horarios),
  });
}

export async function crearBloqueo(block: Omit<Block, "id">) {
  return mapBlock(
    await api<Parameters<typeof mapBlock>[0]>("/api/bloqueos/", {
      method: "POST",
      body: JSON.stringify(block),
    }),
  );
}

export async function eliminarBloqueo(id: string) {
  await api(`/api/bloqueos/${id}/`, { method: "DELETE" });
}

export async function guardarConfig(settings: BusinessSettings) {
  return api<BusinessSettings>("/api/configuracion/", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export async function eliminarCliente(id: string) {
  await api(`/api/clientes/${id}/`, { method: "DELETE" });
}

export async function bloquearCliente(id: string) {
  await api(`/api/clientes/${id}/bloquear/`, { method: "POST" });
}

export async function desbloquearCliente(id: string) {
  await api(`/api/clientes/${id}/desbloquear/`, { method: "POST" });
}

export async function cambiarRolCliente(id: string, rol: Role) {
  await api(`/api/clientes/${id}/cambiar_rol/`, {
    method: "POST",
    body: JSON.stringify({ rol }),
  });
}

export async function solicitarRecuperacionPassword(email: string) {
  await api("/api/auth/password-reset/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function confirmarRecuperacionPassword(token: string, newPassword: string) {
  await api("/api/auth/password-reset/confirm/", {
    method: "POST",
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

export { ApiError };
