import Image from "next/image";

interface QRImageProps {
  data: string;
  size?: number;
  className?: string;
}

/** Renders a QR code for an invitation code via the public qrserver API. */
export default function QRImage({ data, size = 200, className }: QRImageProps) {
  const value = data || "invitecard";
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    value,
  )}&margin=0&color=2A1A2E&bgcolor=FFFFFF`;

  return (
    <Image
      src={src}
      width={size}
      height={size}
      alt="Invitation QR code"
      className={className}
      unoptimized
      loading="lazy"
    />
  );
}
