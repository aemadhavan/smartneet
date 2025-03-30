// src/app/admin/page.tsx
export default function AdminDashboard() {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <p className="mb-4">Welcome to the administration panel. Please select an option from the sidebar to manage subjects, topics, subtopics, questions, and question papers.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <DashboardCard 
            title="Subjects" 
            description="Manage subject categories" 
            link="/admin/subjects" 
          />
          <DashboardCard 
            title="Topics" 
            description="Manage topics within subjects" 
            link="/admin/topics" 
          />
          <DashboardCard 
            title="Subtopics" 
            description="Manage subtopics within topics" 
            link="/admin/subtopics" 
          />
          <DashboardCard 
            title="Questions" 
            description="Manage question bank" 
            link="/admin/questions" 
          />
          <DashboardCard 
            title="Question Papers" 
            description="Manage exam papers" 
            link="/admin/question-papers" 
          />
        </div>
      </div>
    );
  }
  
  function DashboardCard({ title, description, link }: { title: string; description: string; link: string }) {
    return (
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{description}</p>
        <a href={link} className="text-blue-600 hover:text-blue-800 font-medium">
          Manage →
        </a>
      </div>
    );
  }