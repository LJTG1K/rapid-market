import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  readTime: number;
  category: string;
  featured: boolean;
}

export async function getStaticProps() {
  try {
    const postsData = await import('../../public/data/blog-posts.json');
    return { props: { posts: postsData.default }, revalidate: 3600 };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return { props: { posts: [] }, revalidate: 60 };
  }
}

export default function BlogIndex({ posts }: { posts: BlogPost[] }) {
  const [sortedPosts, setSortedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const sorted = [...posts].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
    setSortedPosts(sorted);
  }, [posts]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <Head>
        <title>Journal — RAPID Marketplace</title>
        <meta name="description" content="Guides and insights on ordering from China with RAPID & Sugargoo" />
        <link rel="canonical" href="https://rapid.market/blog" />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <span className="eyebrow block mb-3">Journal</span>
        <h1 className="font-display font-black text-ink text-6xl md:text-7xl tracking-tightest leading-[0.85] mb-6">
          Journal
        </h1>
        <p className="text-xl text-ink/75 max-w-xl mb-16">
          Guides and insights on ordering from China with RAPID &amp; Sugargoo.
        </p>

        {sortedPosts.length === 0 ? (
          <p className="font-mono text-sm text-muted py-12">No posts yet. Check back soon!</p>
        ) : (
          <div className="border-t border-line">
            {sortedPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block py-10 border-b border-line">
                <div className="flex flex-wrap gap-3 items-center mb-4 font-mono text-xs uppercase tracking-wide text-muted">
                  {post.featured && <span className="tag !bg-stamp !border-stamp !text-paper">Featured</span>}
                  <span>{formatDate(post.publishedAt)}</span>
                  <span>·</span>
                  <span>{post.readTime} min read</span>
                  <span>·</span>
                  <span>{post.category}</span>
                </div>
                <h2 className="font-display font-black text-3xl md:text-4xl tracking-tightest mb-3 group-hover:text-stamp transition-colors max-w-3xl">
                  {post.title}
                </h2>
                <p className="text-lg text-ink/75 leading-relaxed max-w-2xl mb-3">{post.excerpt}</p>
                <span className="link-underline font-mono text-xs uppercase tracking-wide">Read article →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
