export default function VernexLogo({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/logo.svg"
      alt="Vernex"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      draggable={false}
    />
  );
}
