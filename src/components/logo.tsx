import Image from "next/image";
import Link from "next/link";
import logo from "../../public/logo.png";

/**
 * de Jong Self Storage Team logo lockup.
 */
export function Logo({
  href,
  className,
  height = 30,
}: {
  href?: string;
  className?: string;
  height?: number;
}) {
  const img = (
    <Image
      src={logo}
      alt="de Jong Self Storage Team"
      height={height}
      width={Math.round((logo.width / logo.height) * height)}
      priority
      className={className}
    />
  );

  return href ? (
    <Link href={href} className="inline-flex shrink-0 items-center">
      {img}
    </Link>
  ) : (
    <span className="inline-flex shrink-0 items-center">{img}</span>
  );
}
