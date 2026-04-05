import type { ReactNode } from "react";

type Props = {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
};

export default function LegalPageShell({ title, lastUpdated = "April 3, 2026", children }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {lastUpdated}</p>
      <div className="text-gray-700 space-y-6 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
