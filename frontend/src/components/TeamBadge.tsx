import { teamGradient } from "../lib/format";

export default function TeamBadge({
  code,
  size = 44,
}: {
  code: string;
  size?: number;
}) {
  const [a, b] = teamGradient(code);
  return (
    <span
      className="grid shrink-0 place-items-center rounded-xl font-extrabold text-white shadow-md"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        background: `linear-gradient(135deg, ${a}, ${b})`,
      }}
      aria-hidden
    >
      {code}
    </span>
  );
}
