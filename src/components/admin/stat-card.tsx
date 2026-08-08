import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <Icon className={cn("size-5", accent ? "text-terracotta" : "text-gray-400")} aria-hidden="true" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-bark">{value}</p>
    </div>
  );
}
