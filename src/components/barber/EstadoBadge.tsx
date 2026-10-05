import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/lib/barber-store";

const styles: Record<AppointmentStatus, string> = {
  confirmado: "border-success/40 bg-success/15 text-success",
  pendiente: "border-warning/40 bg-warning/15 text-warning",
  completado: "border-success/30 bg-success/10 text-success",
  cancelado: "border-destructive/40 bg-destructive/15 text-destructive",
};

const labels: Record<AppointmentStatus, string> = {
  confirmado: "Confirmado",
  pendiente: "Pendiente",
  completado: "Completado",
  cancelado: "Cancelado",
};

export function EstadoBadge({ estado }: { estado: AppointmentStatus }) {
  return (
    <Badge variant="outline" className={styles[estado]}>
      {labels[estado]}
    </Badge>
  );
}
