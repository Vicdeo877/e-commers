"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppImage from "@/components/AppImage";
import { getBlogPosts } from "@/lib/api";
import { imgUrl } from "@/lib/utils";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import { ArrowRight } from "lucide-react";

interface Blog { slug: string; title: string; excerpt?: string; cover_image?: string; published_at?: string; }

export default function BlogPage() {
  const [posts, setPosts] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlogPosts().then((d) => setPosts(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">From Our Blog</h1>
      <p className="text-gray-500 mb-8">Tips, stories, and insights about fresh fruits and healthy living.</p>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No blog posts yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="h-44 relative overflow-hidden">
                <AppImage
                  src={post.cover_image ? imgUrl(post.cover_image) : null}
                  alt={post.title}
                  fill
                  className="object-cover"
                  placeholderName={post.title}
                  placeholderType="blog"
                />
              </div>
              <div className="p-5">
                {post.published_at && (
                  <p className="text-xs text-gray-400 mb-1">{new Date(post.published_at).toLocaleDateString("en-IN")}</p>
                )}
                <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors line-clamp-2 mb-2">
                  {post.title}
                </h3>
                {post.excerpt && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>}
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  Read Post <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

