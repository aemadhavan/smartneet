import * as dotenv from "dotenv"
import { defineConfig } from 'drizzle-kit';

dotenv.config({
    path: '.env.local'
})

if(!process.env.XATA_DATABASE_URL) { 
    throw new Error("XATA_DATABASE_URL is not defined")
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',  
  dbCredentials: {
    url: process.env.XATA_DATABASE_URL,
  },  
  strict: true,
});
