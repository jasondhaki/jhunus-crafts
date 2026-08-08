import { ChevronDown } from "lucide-react";

interface InfoAccordionProps {
  weave: string | null;
}

export function InfoAccordion({ weave }: InfoAccordionProps) {
  const items = [
    {
      title: "Care Instructions",
      content:
        "Spot clean with a dry or slightly damp cloth — jute weakens when fully saturated, so avoid machine washing or soaking. Air dry away from direct sunlight, which can fade natural dyes over time. Reshape by hand while damp if the weave loses its structure. A light brushing removes surface dust and keeps the fibers looking fresh.",
    },
    {
      title: "Shipping & Returns",
      content:
        "Orders ship within 2–3 business days from our workshop, with delivery typically taking 5–10 business days depending on location. Because each piece is handwoven, small variations in color and pattern are normal and not grounds for return. Unused items in original condition can be returned within 30 days of delivery for a full refund.",
    },
    {
      title: "The Craft",
      content: weave
        ? `This piece was woven by hand in a ${weave.toLowerCase()} pattern, on a traditional wooden loom, using raw jute fiber sourced from small farms in West Bengal. No two pieces are ever perfectly identical — the slight irregularities in tension and pattern are part of what makes each one genuinely handmade.`
        : "This piece was woven by hand on a traditional wooden loom, using raw jute fiber sourced from small farms in West Bengal. No two pieces are ever perfectly identical — the slight irregularities in tension and pattern are part of what makes each one genuinely handmade.",
    },
  ];

  return (
    <div className="divide-y divide-hairline border-y border-hairline">
      {items.map((item) => (
        <details key={item.title} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-lg text-bark [&::-webkit-details-marker]:hidden">
            {item.title}
            <ChevronDown
              className="size-5 shrink-0 text-jute transition-transform duration-200 ease-out group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-jute">{item.content}</p>
        </details>
      ))}
    </div>
  );
}
