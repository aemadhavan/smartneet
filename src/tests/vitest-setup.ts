
import { vi } from 'vitest';

// Define dbLimitMock at the top level of this setup file
export const dbLimitMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: dbLimitMock,
        }),
      }),
    }),
  },
}));
