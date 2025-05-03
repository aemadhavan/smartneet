// src/app/admin/biology/layout.tsx
import { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage } from "@/components/ui/breadcrumb";

interface BiologyLayoutProps {
  children: ReactNode;
}

export default function BiologyLayout({ children }: BiologyLayoutProps) {
  return (
    <div className="container mx-auto p-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbPage>Biology</BreadcrumbPage>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <h1 className="text-3xl font-bold mb-6">Biology Content Management</h1>
      
      <Tabs defaultValue="questions" className="mb-6">
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link href="/admin/biology">Overview</Link>
          </TabsTrigger>
          <TabsTrigger value="topics" asChild>
            <Link href="/admin/biology/topics">Topics</Link>
          </TabsTrigger>
          <TabsTrigger value="subtopics" asChild>
            <Link href="/admin/biology/subtopics">Subtopics</Link>
          </TabsTrigger>
          <TabsTrigger value="questions" asChild>
            <Link href="/admin/biology/questions">Questions</Link>
          </TabsTrigger>
          <TabsTrigger value="papers" asChild>
            <Link href="/admin/biology/question-papers">Question Papers</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {children}
    </div>
  );
}
