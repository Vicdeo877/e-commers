"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppImage from "@/components/AppImage";
import Link from "next/link";
import { getBlogPost } from "@/lib/api";
import { imgUrl } from "@/lib/utils";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import { ArrowLeft } from "lucide-react";

interface Post { title: string; excerpt?: string; content?: string; cover_image?: string; published_at?: string; }

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    if (!slug) return;
    getBlogPost(slug).then((d) => { if (d) setPost(d); else router.push("/blog"); }).catch(() => router.push("/blog"));
  }, [slug, router]);

  if (!post) return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-2/3" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Blog
      </button>
      <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-6">
        <AppImage
          src={post.cover_image ? imgUrl(post.cover_image) : null}
          alt={post.title}
          fill
          className="object-cover"
          placeholderName={post.title}
          placeholderType="blog"
        />
      </div>
      {post.published_at && (
        <p className="text-xs text-gray-400 mb-2">{new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      )}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
      {post.excerpt && <p className="text-lg text-gray-500 mb-6 leading-relaxed">{post.excerpt}</p>}
      {post.content && (
        <div className="prose prose-green max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: post.content }} />
      )}
      <div className="mt-10 pt-6 border-t">
        <Link href="/blog" className="text-green-600 hover:underline text-sm flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> All Blog Posts
        </Link>
      </div>
    </div>
  );
}
