import type { Metadata, ResolvingMetadata } from "next";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

// Helper function duplicated here to ensure server environment compliance
const imgUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/uploads")) return path;
  return `/uploads/${path}`;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const images = product.imageMain ? [imgUrl(product.imageMain)] : [];

  return {
    title: product.name,
    description: product.shortDescription || product.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || "Buy fresh premium fruits online.",
    openGraph: {
      title: product.name,
      description: product.shortDescription || "Farm fresh premium quality fruit.",
      url: `/product/${slug}`,
      siteName: "BlissFruitz",
      images: images.map(url => ({ url })),
      type: "website", // Or "og:product" but Next natively supports website best
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      images: images,
    },
    alternates: {
      canonical: `/product/${slug}`,
    },
  };
}

export default async function ProductLayout({ params, children }: Props) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug },
  });

  let jsonLd = null;
  if (product) {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: product.imageMain ? imgUrl(product.imageMain) : undefined,
      description: product.shortDescription || `Buy premium quality ${product.name} at BlissFruitz.`,
      sku: product.sku || product.slug,
      offers: {
        "@type": "Offer",
        url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://blissfruitz.com"}/product/${product.slug}`,
        priceCurrency: "INR",
        price: product.price,
        itemCondition: "https://schema.org/NewCondition",
        availability: product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}