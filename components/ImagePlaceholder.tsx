/**
 * Styled placeholder shown when a product or blog image is missing or fails to load.
 * Each item gets a deterministic gradient colour based on its name.
 */

const GRADIENTS = [
  "from-green-400 to-emerald-600",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-600",
  "from-violet-400 to-purple-600",
  "from-sky-400 to-blue-600",
  "from-lime-400 to-green-600",
  "from-fuchsia-400 to-pink-500",
  "from-teal-400 to-cyan-600",
];

function gradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return GRADIENTS[hash % GRADIENTS.length];
}

interface Props {
  name: string;
  type?: "product" | "blog" | "banner" | "category";
  className?: string;
}

const TYPE_ICON: Record<string, string> = {
  product: "🍃",
  blog: "📝",
  banner: "🖼️",
  category: "🍊",
};

export default function ImagePlaceholder({ name, type = "product", className = "" }: Props) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";
  const gradient = gradientFor(name ?? "");
  const icon = TYPE_ICON[type];

  return (
    <div
      className={`bg-gradient-to-br ${gradient} flex flex-col items-center justify-center w-full h-full ${className}`}
    >
      <span className="text-white/30 text-5xl mb-1 select-none">{icon}</span>
      <span className="text-white font-bold text-2xl select-none drop-shadow">{initial}</span>
    </div>
  );
}
