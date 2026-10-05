import { Link } from "@tanstack/react-router";

import logoImage from "@/assets/Logo-Barberia.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group flex items-center gap-3 ${className}`}>
      <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-[oklch(0.95_0_0)] p-1 shadow-gold transition-colors group-hover:border-primary/60">
        <img
          src={logoImage}
          alt="Logo Barberia YESIT"
          width={48}
          height={48}
          className="h-full w-full object-contain"
        />
      </span>
      <span className="leading-none">
        <span className="block text-[0.65rem] tracking-[0.3em] text-muted-foreground">BARBERIA</span>
        <span className="block font-display text-2xl tracking-[0.15em] text-gold">YESIT</span>
      </span>
    </Link>
  );
}
