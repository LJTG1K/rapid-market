import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import fs from 'fs';
import path from 'path';

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

export async function getStaticProps({ params }: { params: { slug: string } }) {
  try {
    const postsData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'public/data/blog-posts.json'), 'utf8')
    );
    const posts: BlogPost[] = postsData;
    const post = posts.find((p: BlogPost) => p.slug === params.slug);
    if (!post) return { notFound: true };

    let content = '';
    try {
      content = fs.readFileSync(path.join(process.cwd(), 'public/data/blog', `${params.slug}.md`), 'utf8');
    } catch (error) {
      console.error(`Could not load markdown for ${params.slug}:`, error);
    }

    return { props: { post, content }, revalidate: 3600 };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return { notFound: true };
  }
}

export async function getStaticPaths() {
  try {
    const postsData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'public/data/blog-posts.json'), 'utf8')
    );
    const posts: BlogPost[] = postsData;
    return { paths: posts.map((p) => ({ params: { slug: p.slug } })), fallback: false };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return { paths: [], fallback: false };
  }
}

export default function BlogPost({ post, content }: { post: BlogPost; content: string }) {
  const [contentHtml, setContentHtml] = useState('');

  useEffect(() => {
    setContentHtml(content);
  }, [content]);

  if (!post) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <Head>
        <title>{post.title} — RAPID Journal</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`https://rapid.market/blog/${post.slug}`} />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <Link href="/blog" className="link-underline font-mono text-xs uppercase tracking-wide">
          ← Journal
        </Link>

        <div className="mt-8 mb-14 max-w-3xl">
          <span className="tag !bg-stamp !border-stamp !text-paper mb-6 inline-block">{post.category}</span>
          <h1 className="font-display font-black text-ink text-5xl md:text-6xl tracking-tightest leading-[0.9] mb-6">
            {post.title}
          </h1>
          <div className="flex flex-wrap gap-3 font-mono text-xs uppercase tracking-wide text-muted">
            <span>{post.author}</span>
            <span>·</span>
            <span>{formatDate(post.publishedAt)}</span>
            <span>·</span>
            <span>{post.readTime} min read</span>
          </div>
        </div>

        <article className="max-w-3xl border-t border-line pt-10">
          <div className="prose max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="font-display font-black text-4xl tracking-tightest mb-6 mt-12">{children}</h1>,
                h2: ({ children }) => <h2 className="font-display font-black text-3xl tracking-tightest mb-4 mt-10">{children}</h2>,
                h3: ({ children }) => <h3 className="font-display font-black text-2xl tracking-tightest mb-3 mt-8">{children}</h3>,
                p: ({ children }) => <p className="text-lg leading-relaxed mb-6 text-ink/80">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-outside pl-5 mb-6 space-y-2 text-lg text-ink/80">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside pl-5 mb-6 space-y-2 text-lg text-ink/80">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-stamp pl-6 py-1 mb-6 text-lg italic text-ink/75">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a href={href} className="link-underline font-semibold">{children}</a>
                ),
                code: ({ children }) => (
                  <code className="bg-paper border border-line px-1.5 py-0.5 font-mono text-sm">{children}</code>
                ),
                table: ({ children }) => <table className="w-full border-collapse mb-6">{children}</table>,
                th: ({ children }) => <th className="border border-line px-4 py-2 bg-paper font-semibold text-left">{children}</th>,
                td: ({ children }) => <td className="border border-line px-4 py-2">{children}</td>,
                hr: () => <hr className="my-10 border-t border-line" />,
              }}
            >
              {contentHtml}
            </ReactMarkdown>
          </div>
        </article>

        <div className="max-w-3xl mt-16 bg-dusk text-stone p-10 md:p-14 text-center">
          <h3 className="font-display font-black text-2xl md:text-3xl tracking-tightest mb-4">
            Ready to start your first haul?
          </h3>
          <p className="text-stone/70 mb-6">Browse thousands of products and start ordering from China today.</p>
          <Link href="/" className="btn-stamp">Shop now</Link>
        </div>
      </div>
    </>
  );
}
