import type { Product, Category, BlogPost, Banner, Offer, Coupon, Review, User, Order, OrderItem } from "@prisma/client";

export function mapProduct(
  p: Product & { category?: Category | null },
  opts?: { admin?: boolean }
) {
  const base = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compare_price: p.comparePrice ?? undefined,
    unit: p.unit,
    stock_quantity: p.stockQuantity,
    image_main: p.imageMain ?? undefined,
    description: p.description ?? undefined,
    short_description: p.shortDescription ?? undefined,
    sku: p.sku ?? undefined,
    is_active: p.isActive ? 1 : 0,
    is_featured: p.isFeatured ? 1 : 0,
    category_id: p.categoryId ?? undefined,
    category: p.category ? { name: p.category.name, slug: p.category.slug } : undefined,
  };
  if (opts?.admin) return base;
  return base;
}

export function mapCategory(c: Category) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? undefined,
    image: c.image ?? undefined,
  };
}

export function mapBlogList(p: BlogPost) {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? undefined,
    cover_image: p.coverImage ?? undefined,
    published_at: p.publishedAt?.toISOString(),
  };
}

/** Admin list + edit form: includes id, publish flag, and full content. */
export function mapBlogAdminPost(p: BlogPost) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? undefined,
    content: p.content,
    cover_image: p.coverImage ?? undefined,
    published_at: p.publishedAt?.toISOString(),
    is_published: p.isPublished,
  };
}

export function mapBlogDetail(p: BlogPost) {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? undefined,
    content: p.content,
    cover_image: p.coverImage ?? undefined,
    published_at: p.publishedAt?.toISOString(),
  };
}

export function mapBanner(b: Banner) {
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    link_url: b.linkUrl ?? undefined,
    image_path: b.imagePath ?? undefined,
    sort_order: b.sortOrder,
  };
}

export function mapOffer(o: Offer) {
  return {
    id: o.id,
    title: o.title,
    description: o.description,
    coupon_code: o.couponCode ?? undefined,
    discount_value: o.discountValue,
    sort_order: o.sortOrder,
    highlight: o.highlight,
    is_active: o.isActive,
  };
}

export function mapCoupon(c: Coupon) {
  return {
    id: c.id,
    code: c.code,
    description: c.description ?? undefined,
    type: c.discountType,
    value: c.discountValue,
    min_order_amount: c.minOrder ?? 0,
    max_discount: c.maxDiscount ?? undefined,
    usage_limit: undefined as number | undefined,
    used_count: 0,
    valid_from: undefined as string | undefined,
    valid_until: c.expiresAt?.toISOString(),
    is_active: c.isActive ? 1 : 0,
    audience_segment: c.audienceSegment ?? "all",
    segment_min_orders: c.segmentMinOrders ?? undefined,
    segment_max_orders: c.segmentMaxOrders ?? undefined,
    segment_loyal_min_orders: c.segmentLoyalMinOrders ?? undefined,
    segment_max_account_age_days: c.segmentMaxAccountAgeDays ?? undefined,
    segment_min_account_age_days: c.segmentMinAccountAgeDays ?? undefined,
  };
}

export function mapReviewPublic(
  r: Review & { user?: User | null },
  product?: { name: string; slug: string }
) {
  return {
    id: r.id,
    rating: r.rating,
    title: r.title ?? undefined,
    comment: r.comment ?? undefined,
    guest_name: r.guestName ?? undefined,
    user: r.user ? { full_name: r.user.fullName } : undefined,
    created_at: r.createdAt.toISOString(),
    product_id: r.productId,
    product_name: product?.name,
    product_slug: product?.slug,
    is_approved: r.approved ? 1 : 0,
    user_name: r.user?.fullName,
  };
}

export function mapOrderAdmin(o: Order & { items?: OrderItem[] }) {
  return {
    id: o.id,
    order_number: o.orderNumber,
    total: o.total,
    subtotal: o.subtotal,
    shipping_amount: o.shippingAmount,
    discount_amount: o.discountAmount,
    order_status: o.orderStatus,
    payment_status: o.paymentStatus,
    payment_method: o.paymentMethod,
    shipping_name: o.shippingName,
    shipping_phone: o.shippingPhone,
    shipping_address: o.shippingAddress,
    shipping_city: o.shippingCity,
    shipping_state: o.shippingState,
    shipping_pincode: o.shippingPincode,
    customer_email: o.guestEmail ?? undefined,
    coupon_code: o.couponCode ?? undefined,
    razorpay_payment_id: o.razorpayPaymentId ?? undefined,
    tracking_number: o.trackingNumber ?? undefined,
    location_link: (o as any).locationLink ?? undefined,
    created_at: o.createdAt.toISOString(),
    updated_at: o.updatedAt.toISOString(),
    items: o.items?.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      total: i.price * i.quantity,
    })),
  };
}
