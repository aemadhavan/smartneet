// src/db/checkMainBranch.ts
import dotenv from 'dotenv';
import path from 'path';
import axios, { AxiosError } from 'axios';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface Branch {
  name: string;
  default: boolean;
}

// Define a more specific type for the records, assuming they are questions
interface Question {
  id: string;
  // Add other relevant fields if known, or use a more generic approach
  // For example, if the structure is highly variable but you want to avoid 'any':
  // [key: string]: unknown; 
}

interface XataResponse {
  records: Question[]; // Replaced any[] with Question[]
  meta?: {
    page?: {
      totalCount?: number;
    }
  }
}

interface BranchesResponse {
  branches: Branch[];
}

interface ErrorResponse {
  message?: string;
}

async function checkMainBranch() {
  const apiKey = process.env.XATA_API_KEY;
  
  if (!apiKey) {
    console.error("Error: XATA_API_KEY is not set in .env.local");
    process.exit(1);
  }
  
  console.log("Checking questions table in main branch via Xata API...");
  
  try {
    const workspaceId = "Madhavan-s-workspace-79j6ki";
    const region = "us-east-1";
    const dbName = "smartneet";
    
    // First check main branch
    const urlMain = `https://${workspaceId}.${region}.xata.sh/db/${dbName}:main/tables/questions/query`;
    
    const responseMain = await axios.post<XataResponse>(urlMain, {
      page: { size: 1 } // Just to check if records exist
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (responseMain.data && responseMain.data.records) {
      console.log(`Main branch has ${responseMain.data.meta?.page?.totalCount ?? 'unknown number of'} questions`);
    }
    
    // Also check if there's a dev branch
    try {
      const urlDev = `https://${workspaceId}.${region}.xata.sh/db/${dbName}:dev/tables/questions/query`;
      
      const responseDev = await axios.post<XataResponse>(urlDev, {
        page: { size: 1 }
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (responseDev.data && responseDev.data.records) {
        console.log(`Dev branch has ${responseDev.data.meta?.page?.totalCount ?? 'unknown number of'} questions`);
      }
    } catch (error) {
      const devError = error as AxiosError;
      const errorData = devError.response?.data as ErrorResponse;
      console.log("Dev branch check failed:", errorData?.message || devError.message);
    }
    
    // List all branches
    try {
      const branchesUrl = `https://${workspaceId}.${region}.xata.sh/db/${dbName}/branches`;
      
      const branchesResponse = await axios.get<BranchesResponse>(branchesUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (branchesResponse.data && branchesResponse.data.branches) {
        console.log("Available branches:");
        branchesResponse.data.branches.forEach((branch: Branch) => {
          console.log(`- ${branch.name} ${branch.default ? '(default)' : ''}`);
        });
      }
    } catch (error) {
      const branchError = error as AxiosError;
      const errorData = branchError.response?.data as ErrorResponse;
      console.log("Failed to list branches:", errorData?.message || branchError.message);
    }
    
  } catch (error) {
    const apiError = error as AxiosError;
    const errorData = apiError.response?.data as ErrorResponse;
    console.error("API request failed:", errorData?.message || apiError.message);
  }
}

checkMainBranch().catch(console.error);
