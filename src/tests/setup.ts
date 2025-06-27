/// <reference types="vitest/globals" />
import { config } from 'dotenv';
import path from 'path';

/**
 * Loads environment variables from a .env.test file into process.env.
 * This setup file is specified in vitest.config.ts and runs before any tests.
 */
config({ path: path.resolve(process.cwd(), '.env.test') });

