"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/assets/products/placeholder.svg";

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  priority,
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  if (fill) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={cn(className)}
        onError={() => setImgSrc(PLACEHOLDER)}
        priority={priority}
        loading={priority ? "eager" : undefined}
        sizes={sizes}
      />
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width ?? 400}
      height={height ?? 400}
      className={cn(className)}
      onError={() => setImgSrc(PLACEHOLDER)}
      priority={priority}
      loading={priority ? "eager" : undefined}
      sizes={sizes}
    />
  );
}
