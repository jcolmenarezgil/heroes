import React from "react";

interface SectionProps {
  label: string;
  value: React.ReactNode;
  first?: boolean;
}

export default function Section({ label, value, first = false }: SectionProps) {
  return (
    <div className={`py-4 ${first ? "" : "border-t border-neutral-900"}`}>
      <p className="text-sm text-neutral-400">{label}</p>
      <div className="mt-1 text-base text-white">{value}</div>
    </div>
  );
}
