interface ProductSpecsProps {
  dimensions: string | null;
  materials: string;
  weave: string | null;
  color: string | null;
}

export function ProductSpecs({ dimensions, materials, weave, color }: ProductSpecsProps) {
  const rows: [string, string][] = [
    ...(dimensions ? ([["Dimensions", dimensions]] as [string, string][]) : []),
    ["Materials", materials],
    ...(weave ? ([["Weave", weave]] as [string, string][]) : []),
    ...(color ? ([["Color", color]] as [string, string][]) : []),
  ];

  return (
    <dl className="divide-y divide-hairline border-y border-hairline text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 py-3">
          <dt className="text-jute">{label}</dt>
          <dd className="text-right text-bark">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
