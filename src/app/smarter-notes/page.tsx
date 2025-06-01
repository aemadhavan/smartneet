// File: src/app/smarter-notes/page.tsx
import Link from "next/link";
import { type SanityDocument } from "next-sanity";

import { client } from "@/sanity/client";

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{_id, title, slug, publishedAt}`;

const options = { next: { revalidate: 30 } };

export default async function SmarterNotesPage() {
  const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options);

  return (
    <main className="container mx-auto min-h-screen max-w-4xl p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Smarter Notes</h1>
        <p className="text-gray-600 text-lg">
          Comprehensive study materials and notes for NEET preparation
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <Link href={`/smarter-notes/${post.slug.current}`}>
                <h2 className="text-xl font-semibold mb-3 text-blue-600 hover:text-blue-800">
                  {post.title}
                </h2>
                <p className="text-gray-500 text-sm">
                  Published: {new Date(post.publishedAt).toLocaleDateString()}
                </p>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No study notes available yet.</p>
        </div>
      )}
    </main>
  );
}