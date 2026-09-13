import Image from "next/image";

export function BrandLogo({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo/icon-gold-navy.svg"
      alt="EcardHub logo"
      width={size}
      height={size}
      className={className}
      priority={size >= 36}
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(6, Math.round(size * 0.22)),
        display: "block",
      }}
    />
  );
}
