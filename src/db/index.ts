
import { drizzle } from 'drizzle-orm/node-postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

export const db = drizzle(process.env.DATABASE_URL!);
