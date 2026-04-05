"use client";

import { useEffect, useState } from "react";
import ImagePlaceholder from "./ImagePlaceholder";

interface Props {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  placeholderName?: string;
  placeholderType?: "product" | "blog" | "banner" | "category";
  sizes?: string;
  fit?: "cover" | "contain";
}

/**
 * Drop-in replacement for next/image that works with any external URL
 * without requiring hostname configuration in next.config.
 */
export default function AppImage({
  src,
  alt,
  fill,
  width,
  height,
  className = "",
  placeholderName,
  placeholderType = "product",
  fit = "cover",
}: Props) {
  const [error, setError] = useState(false);

  // If src changes (e.g. API data arrives), clear any previous error state.
  useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) {
    return placeholderName ? (
      <ImagePlaceholder name={placeholderName} type={placeholderType} />
    ) : (
      <div className={`bg-gray-100 ${className}`} />
    );
  }

  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setError(true)}
        className={`absolute inset-0 w-full h-full ${className}`}
        style={{ objectFit: fit }}
        loading="lazy"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      onError={() => setError(true)}
      className={className}
      style={
        width && height
          ? { objectFit: fit, width, height }
          : { objectFit: fit }
      }
      loading="lazy"
    />
  );
}
