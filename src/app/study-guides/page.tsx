// File: src/app/study-guides/page.tsx (Main Subject Overview)
import Link from "next/link";
import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/client";
import { Metadata } from "next";
import Image from "next/image";

// Define the specific types for our queries
interface SanityImage {
  asset: {
    url: string;
  };
}

interface NeetSubject extends SanityDocument {
  title: string;
  slug: { current: string };
  description: string;
  coverImage?: SanityImage;
  subjectCode: string;
  topicCount: number;
  recentGuides: Array<{
    title: string;
    slug: { current: string };
    excerpt: string;
    readingTime: number;
    featuredImage?: SanityImage;
    difficultyLevel: string;
  }>;
  allGuides: Array<{
    viewCount: number;
  }>;
}

interface NeetSubjectWithTotalViews extends NeetSubject {
  totalViews: number;
}

interface FeaturedGuide extends SanityDocument {
  title: string;
  slug: { current: string };
  excerpt: string;
  readingTime: number;
  difficultyLevel: string;
  featuredImage?: SanityImage;
  viewCount: number;
  subject: {
    title: string;
    slug: { current: string };
    subjectCode: string;
  };
  author: {
    fullName: string;
    portrait?: SanityImage;
  };
}

const SUBJECTS_OVERVIEW_QUERY = `*[_type == "neetSubject"] | order(sortOrder asc) {
  _id,
  title,
  slug,
  description,
  coverImage,
  subjectCode,
  "topicCount": count(*[_type == "neetStudyGuide" && subject._ref == ^._id && status == "published"]),
  "recentGuides": *[_type == "neetStudyGuide" && subject._ref == ^._id && status == "published"] | order(publishedAt desc)[0...3] {
    title,
    slug,
    excerpt,
    readingTime,
    featuredImage,
    difficultyLevel
  },
  "allGuides": *[_type == "neetStudyGuide" && subject._ref == ^._id] {
    viewCount
  }
}`;

const FEATURED_GUIDES_QUERY = `*[_type == "neetStudyGuide" && status == "published"] | order(viewCount desc, publishedAt desc)[0...6] {
  _id,
  title,
  slug,
  excerpt,
  readingTime,
  difficultyLevel,
  featuredImage,
  viewCount,
  subject->{title, slug, subjectCode},
  author->{fullName, portrait}
}`;

const options = { next: { revalidate: 3600 } };

export const metadata: Metadata = {
  title: "NEET Study Guides 2024 | Complete Biology, Physics, Chemistry Notes | SmarterNEET",
  description: "Free comprehensive NEET study guides for Biology, Physics, and Chemistry. Expert-written notes with diagrams, formulas, and previous year questions for NEET 2024 preparation.",
  keywords: ["NEET study guides", "NEET 2024", "Biology notes", "Physics notes", "Chemistry notes", "NEET preparation", "medical entrance exam"],
  openGraph: {
    title: "NEET Study Guides 2024 | Free Complete Notes",
    description: "Master NEET with our comprehensive study guides covering all subjects. Free access to expert-written content.",
    type: "website",
  },
};

export default async function StudyGuidesPage() {
  const [subjects, featuredGuides] = await Promise.all([
    client.fetch<NeetSubject[]>(SUBJECTS_OVERVIEW_QUERY, {}, options),
    client.fetch<FeaturedGuide[]>(FEATURED_GUIDES_QUERY, {}, options),
  ]);

  // Calculate total views for each subject on the client side
  const subjectsWithTotalViews: NeetSubjectWithTotalViews[] = subjects.map(subject => ({
    ...subject,
    totalViews: subject.allGuides?.reduce((sum: number, guide: { viewCount: number }) => sum + (guide.viewCount || 0), 0) || 0
  }));

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="container mx-auto max-w-7xl px-8">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-8 text-gray-900 leading-tight">
              Master NEET 2024
              <span className="block text-blue-600">Study Guides</span>
            </h1>
            <p className="text-xl text-gray-700 mb-10 max-w-4xl mx-auto leading-relaxed">
              Comprehensive, expert-written study guides for Biology, Physics, and Chemistry. 
              Free access to all topics with detailed explanations, diagrams, formulas, and previous year questions.
            </p>
            
            {/* Key Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-10">
              <div className="bg-white rounded-xl px-6 py-4 shadow-md">
                <div className="text-2xl font-bold text-blue-600">{subjectsWithTotalViews.reduce((sum, s) => sum + (s.topicCount || 0), 0)}+</div>
                <div className="text-sm text-gray-600">Study Guides</div>
              </div>
              <div className="bg-white rounded-xl px-6 py-4 shadow-md">
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-sm text-gray-600">Free Access</div>
              </div>
              <div className="bg-white rounded-xl px-6 py-4 shadow-md">
                <div className="text-2xl font-bold text-purple-600">{subjectsWithTotalViews.reduce((sum, s) => sum + (s.totalViews || 0), 0).toLocaleString()}+</div>
                <div className="text-sm text-gray-600">Students Helped</div>
              </div>
              <div className="bg-white rounded-xl px-6 py-4 shadow-md">
                <div className="text-2xl font-bold text-orange-600">2024</div>
                <div className="text-sm text-gray-600">Updated Syllabus</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="#subjects"
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-lg"
              >
                Start Learning
              </Link>
              <Link 
                href="/practice"
                className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-lg"
              >
                Take Practice Test
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Grid */}
      <section id="subjects" className="py-20 bg-white">
        <div className="container mx-auto max-w-7xl px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Choose Your Subject</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive study materials organized by subject with expert insights and exam-focused content
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {subjectsWithTotalViews.map((subject) => (
              <div key={subject._id} className="group relative bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                {/* Subject Header */}
                <div className="p-8 text-center">
                  <div className="text-6xl mb-6">
                    {subject.subjectCode === 'BIO' ? '🧬' : 
                     subject.subjectCode === 'PHY' ? '⚛️' : 
                     subject.subjectCode === 'CHE' ? '🧪' : '📚'}
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-gray-900">{subject.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{subject.description}</p>
                  
                  {/* Stats */}
                  <div className="flex justify-center gap-8 mb-8 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-lg text-blue-600">{subject.topicCount || 0}</div>
                      <div className="text-gray-500">Study Guides</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg text-green-600">{(subject.totalViews || 0).toLocaleString()}</div>
                      <div className="text-gray-500">Views</div>
                    </div>
                  </div>

                  <Link 
                    href={`/study-guides/${subject.slug.current}`}
                    className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors group-hover:scale-105 transform duration-300"
                  >
                    Explore {subject.title}
                  </Link>
                </div>

                {/* Recent Guides Preview */}
                {subject.recentGuides && subject.recentGuides.length > 0 && (
                  <div className="border-t border-gray-100 p-6 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-4">Latest Guides:</h4>
                    <div className="space-y-3">
                      {subject.recentGuides.slice(0, 2).map((guide) => (
                        <div key={guide.slug.current} className="group/guide">
                          <Link 
                            href={`/study-guides/${subject.slug.current}/${guide.slug.current}`}
                            className="block"
                          >
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm text-gray-900 group-hover/guide:text-blue-600 line-clamp-1">
                                  {guide.title}
                                </h5>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-500">{guide.readingTime} min</span>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {guide.difficultyLevel}
                                  </span>
                                </div>
                              </div>
                              <svg className="w-4 h-4 text-gray-400 group-hover/guide:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Study Guides */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto max-w-7xl px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Most Popular Study Guides</h2>
            <p className="text-xl text-gray-600">Top-rated guides that helped thousands of NEET aspirants</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredGuides.map((guide) => (
              <article key={guide._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
                {guide.featuredImage && (
                  <div className="aspect-video bg-gray-200 overflow-hidden">
                    <Image
                      src={`${guide.featuredImage.asset.url}?w=400&h=225&fit=crop`}
                      alt={guide.title}
                      width={400}
                      height={225}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                      {guide.subject.title}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                      {guide.difficultyLevel}
                    </span>
                    {guide.viewCount > 1000 && (
                      <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        🔥 Popular
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    <Link href={`/study-guides/${guide.subject.slug.current}/${guide.slug.current}`}>
                      {guide.title}
                    </Link>
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{guide.excerpt}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {guide.author.portrait && (
                        <Image
                          src={`${guide.author.portrait.asset.url}?w=32&h=32&fit=crop`}
                          alt={guide.author.fullName}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-700">{guide.author.fullName}</p>
                        <p className="text-xs text-gray-500">{guide.readingTime} min read</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {guide.viewCount?.toLocaleString()} views
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto max-w-4xl px-8 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Ace NEET 2024?</h2>
          <p className="text-xl mb-10 opacity-90">
            Join thousands of successful NEET aspirants who trust SmarterNEET for their preparation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/practice"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Practice Tests
            </Link>
            <Link 
              href="/dashboard"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              View Your Progress
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}