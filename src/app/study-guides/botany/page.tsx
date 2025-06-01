// File: src/app/study-guides/biology/page.tsx (Debug Version)
import Link from "next/link";
import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/client";
import { Metadata } from "next";
import Image from "next/image";

// Define specific types for our queries
interface SanityImage {
  asset: {
    url: string;
  };
}

interface BiologyGuide extends SanityDocument {
  title: string;
  slug: { current: string };
  excerpt: string;
  readingTime: number;
  difficultyLevel: string;
  featuredImage?: SanityImage;
  publishedAt: string;
  viewCount: number;
  topicName: string;
  subtopicName?: string;
  keyTakeaways?: string[];
  author: {
    fullName: string;
    portrait?: SanityImage;
  };
  subject: {
    title: string;
    slug: { current: string };
  };
}

interface BiologySubject extends SanityDocument {
  title: string;
  description: string;
  coverImage?: SanityImage;
  totalGuides: number;
  allGuides: Array<{
    viewCount: number;
  }>;
}

interface BiologySubjectWithTotalViews extends Omit<BiologySubject, 'allGuides'> {
  totalViews: number;
}

// Debug query - let's see what subjects exist
const DEBUG_SUBJECTS_QUERY = `*[_type == "neetSubject"] {
  title,
  slug,
  subjectCode
}`;

const BIOLOGY_GUIDES_QUERY = `*[_type == "neetStudyGuide" && subject->slug.current == "biology" && status == "published"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  readingTime,
  difficultyLevel,
  featuredImage,
  publishedAt,
  viewCount,
  topicName,
  subtopicName,
  keyTakeaways,
  author->{fullName, portrait},
  subject->{title, slug}
}`;

const BIOLOGY_SUBJECT_QUERY = `*[_type == "neetSubject" && slug.current == "biology"][0] {
  title,
  description,
  coverImage,
  "totalGuides": count(*[_type == "neetStudyGuide" && references(^._id) && status == "published"]),
  "allGuides": *[_type == "neetStudyGuide" && references(^._id)] {
    viewCount
  }
}`;

const options = { next: { revalidate: 1800 } };

export const metadata: Metadata = {
  title: "NEET Biology Study Guides 2024 | Complete Botany & Zoology Notes | SmarterNEET",
  description: "Comprehensive NEET Biology study guides covering all 31 topics in Botany and Zoology. Free detailed notes with diagrams, formulas, and previous year questions for NEET 2024.",
  keywords: ["NEET Biology", "Biology notes", "Botany notes", "Zoology notes", "NEET 2024", "medical entrance biology"],
};

export default async function BiologyPage() {
  try {
    // Debug: First check what subjects exist
    const allSubjects = await client.fetch(DEBUG_SUBJECTS_QUERY, {}, options);
    console.log('All subjects in Sanity:', allSubjects);

    const [guides, subjectInfo] = await Promise.all([
      client.fetch<BiologyGuide[]>(BIOLOGY_GUIDES_QUERY, {}, options),
      client.fetch<BiologySubject>(BIOLOGY_SUBJECT_QUERY, {}, options),
    ]);

    console.log('Biology subject info:', subjectInfo);
    console.log('Biology guides count:', guides?.length || 0);

    if (!subjectInfo) {
      console.log('No biology subject found in Sanity');
      // Instead of notFound(), let's show available subjects for debugging
      return (
        <main className="min-h-screen bg-white p-8">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Debug: Biology Subject Not Found</h1>
            <p className="mb-4">The biology subject was not found in Sanity. Available subjects:</p>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(allSubjects, null, 2)}
            </pre>
            <div className="mt-6">
              <Link href="/study-guides" className="text-blue-600 hover:underline">
                ← Back to Study Guides
              </Link>
            </div>
          </div>
        </main>
      );
    }

    // Calculate total views on the client side
    const subjectWithTotalViews: BiologySubjectWithTotalViews = {
      ...subjectInfo,
      totalViews: subjectInfo.allGuides?.reduce((sum: number, guide: { viewCount: number }) => sum + (guide.viewCount || 0), 0) || 0
    };

    // Group guides by topic
    const groupedGuides = guides.reduce((acc: Record<string, BiologyGuide[]>, guide) => {
      const topic = guide.topicName || 'General';
      if (!acc[topic]) {
        acc[topic] = [];
      }
      acc[topic].push(guide);
      return acc;
    }, {});

    const topics = Object.keys(groupedGuides).sort();

    return (
      <main className="min-h-screen bg-white">
        {/* Breadcrumb */}
        <nav className="bg-gray-50 py-4">
          <div className="container mx-auto max-w-7xl px-8">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/study-guides" className="hover:text-blue-600">Study Guides</Link>
              <span>/</span>
              <span className="text-gray-900">Biology</span>
            </div>
          </div>
        </nav>

        {/* Subject Header */}
        <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="container mx-auto max-w-7xl px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <h1 className="text-5xl font-bold mb-6 text-gray-900">
                  🧬 NEET Biology Study Guides
                </h1>
                <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                  {subjectWithTotalViews.description || "Comprehensive Biology study guides for NEET preparation covering all major topics in Botany and Zoology."}
                </p>
                
                <div className="flex flex-wrap gap-6 mb-8">
                  <div className="bg-white rounded-xl px-6 py-4 shadow-md">
                    <div className="text-2xl font-bold text-green-600">{subjectWithTotalViews.totalGuides || 0}</div>
                    <div className="text-sm text-gray-600">Study Guides</div>
                  </div>
                  <div className="bg-white rounded-xl px-6 py-4 shadow-md">
                    <div className="text-2xl font-bold text-blue-600">{topics.length}</div>
                    <div className="text-sm text-gray-600">Topics Covered</div>
                  </div>
                  <div className="bg-white rounded-xl px-6 py-4 shadow-md">
                    <div className="text-2xl font-bold text-purple-600">{subjectWithTotalViews.totalViews.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Views</div>
                  </div>
                </div>

                {topics.length > 0 ? (
                  <Link 
                    href="#topics"
                    className="bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                  >
                    Explore Topics
                  </Link>
                ) : (
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    No study guides found. Check your Sanity data.
                  </div>
                )}
              </div>
              
              {subjectWithTotalViews.coverImage && (
                <div className="flex-1 max-w-md">
                  <Image
                    src={`${subjectWithTotalViews.coverImage.asset.url}?w=500&h=400&fit=crop`}
                    alt="Biology Study Guides"
                    width={500}
                    height={400}
                    className="w-full rounded-2xl shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Topics Grid */}
        {topics.length > 0 && (
          <section id="topics" className="py-20">
            <div className="container mx-auto max-w-7xl px-8">
              <h2 className="text-4xl font-bold text-center mb-16">Biology Topics</h2>
              
              <div className="space-y-12">
                {topics.map((topic) => (
                  <div key={topic} className="bg-gray-50 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold mb-6 text-gray-900">{topic}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groupedGuides[topic].map((guide) => (
                        <article key={guide._id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden group">
                          {guide.featuredImage && (
                            <div className="aspect-video bg-gray-200">
                              <Image
                                src={`${guide.featuredImage.asset.url}?w=400&h=200&fit=crop`}
                                alt={guide.title}
                                width={400}
                                height={200}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          
                          <div className="p-6">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {guide.difficultyLevel}
                              </span>
                              <span className="text-xs text-gray-500">{guide.readingTime} min</span>
                              {guide.viewCount > 500 && (
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                  Popular
                                </span>
                              )}
                            </div>
                            
                            <h4 className="text-lg font-bold mb-3 line-clamp-2 group-hover:text-green-600 transition-colors">
                              <Link href={`/study-guides/biology/${guide.slug.current}`}>
                                {guide.title}
                              </Link>
                            </h4>
                            
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{guide.excerpt}</p>
                            
                            {guide.keyTakeaways && guide.keyTakeaways.length > 0 && (
                              <div className="mb-4">
                                <p className="text-xs font-medium text-gray-700 mb-2">Key Points:</p>
                                <ul className="text-xs text-gray-600 space-y-1">
                                  {guide.keyTakeaways.slice(0, 2).map((point: string, index: number) => (
                                    <li key={index} className="flex items-start gap-1">
                                      <span className="text-green-500 mt-0.5">•</span>
                                      <span className="line-clamp-1">{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                {guide.author.portrait && (
                                  <Image
                                    src={`${guide.author.portrait.asset.url}?w=20&h=20&fit=crop`}
                                    alt={guide.author.fullName}
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 rounded-full"
                                  />
                                )}
                                <span>{guide.author.fullName}</span>
                              </div>
                              <span>{new Date(guide.publishedAt).toLocaleDateString('en-IN')}</span>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="container mx-auto max-w-4xl px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Test Your Biology Knowledge?</h2>
            <p className="text-xl text-gray-700 mb-8">
              Practice with NEET-style questions to reinforce your learning
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/practice?subject=biology"
                className="bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Take Biology Practice Test
              </Link>
              <Link 
                href="/study-guides"
                className="bg-white text-green-600 border-2 border-green-600 px-8 py-4 rounded-xl font-semibold hover:bg-green-50 transition-colors"
              >
                Explore Other Subjects
              </Link>
            </div>
          </div>
        </section>
      </main>
    );

  } catch (error) {
    console.error('Error fetching biology data:', error);
    return (
      <main className="min-h-screen bg-white p-8">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-6 text-red-600">Error Loading Biology Page</h1>
          <p className="mb-4">There was an error fetching the biology data:</p>
          <pre className="bg-red-50 p-4 rounded text-red-800 overflow-auto">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
          <div className="mt-6">
            <Link href="/study-guides" className="text-blue-600 hover:underline">
              ← Back to Study Guides
            </Link>
          </div>
        </div>
      </main>
    );
  }
}