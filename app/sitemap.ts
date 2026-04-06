import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://blissfruitz.com';

  let productUrls: any[] = [];
  let categoryUrls: any[] = [];

  try {
    const products = await prisma.product.findMany({
      select: { slug: true, createdAt: true },
      where: { isActive: true },
    });

    const categories = await prisma.category.findMany({
      select: { slug: true },
    });

    productUrls = products.map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: product.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    categoryUrls = categories.map((category) => ({
      url: `${baseUrl}/shop?category=${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (err) {
    console.error('Sitemap DB Fetch Failed:', err);
  }

  const staticUrls = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  return [...staticUrls, ...categoryUrls, ...productUrls];
}
