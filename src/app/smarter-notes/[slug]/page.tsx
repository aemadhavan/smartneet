// File: src/app/smarter-notes/[slug]/page.tsx (Next.js 15 Compatible)
import { PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/sanity/client";
import Link from "next/link";

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>; // Changed to Promise in Next.js 15
}) {
  // Await params before using it - Required in Next.js 15
  const { slug } = await params;
  
  const post = await client.fetch<SanityDocument>(POST_QUERY, { slug }, options);
  
  if (!post) {
    return (
      <main className="container mx-auto min-h-screen max-w-3xl p-8">
        <Link href="/smarter-notes" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Smarter Notes
        </Link>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <p className="text-gray-600">The requested study note could not be found.</p>
        </div>
      </main>
    );
  }

  const postImageUrl = post.image
    ? urlFor(post.image)?.width(550).height(310).url()
    : null;

  return (
    <main className="container mx-auto min-h-screen max-w-4xl p-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6">
        <Link href="/smarter-notes" className="text-blue-600 hover:text-blue-800">
          Smarter Notes
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <span className="text-gray-900">{post.title}</span>
      </nav>

      {/* Post Image */}
      {postImageUrl && (
        <img
          src={postImageUrl}
          alt={post.title}
          className="w-full aspect-video rounded-xl mb-8 object-cover"
          width="550"
          height="310"
        />
      )}

      {/* Post Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <p className="text-gray-600">
          Published: {new Date(post.publishedAt).toLocaleDateString()}
        </p>
      </header>

      {/* Post Content */}
      <article className="prose prose-lg max-w-none mb-12">
        {Array.isArray(post.body) && <PortableText value={post.body} />}
      </article>

      {/* Practice Test Prompt */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-8 text-center mt-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          Ready to Test Your Knowledge?
        </h2>
        <p className="text-gray-600 mb-6">
          Now that you've studied this topic, test your understanding with practice questions.
        </p>
        <Link 
          href="/practice"
          className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Take Practice Test
        </Link>
      </div>
    </main>
  );
}

// Optional: Add generateMetadata for better SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await client.fetch<SanityDocument>(POST_QUERY, { slug }, options);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.body?.[0]?.children?.[0]?.text?.slice(0, 160) || 'Study material from SmarterNEET',
  };
}