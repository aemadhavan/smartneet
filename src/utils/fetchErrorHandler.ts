// src/utils/fetchErrorHandler.ts

/**
 * Extended Error type with custom properties
 */
interface ExtendedError extends Error {
  isTimeout?: boolean;
  isHandled?: boolean;
  devNote?: string;
}

/**
 * Check if we're in development mode
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if an error is an AbortError (expected when requests are cancelled)
 */
export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.message.includes('abort'))
  );
}

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'TypeError' ||
      error.name === 'NetworkError' ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed') ||
      error.message.includes('network'))
  );
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    ((error as ExtendedError).isTimeout === true ||
      error.message.includes('timeout') ||
      error.message.includes('timed out'))
  );
}

/**
 * Handle fetch errors with proper categorization and user-friendly messages
 */
export function handleFetchError(error: unknown, context: string = 'request'): {
  isExpected: boolean;
  userMessage: string | null;
  shouldLog: boolean;
  shouldRetry: boolean;
} {
  // AbortErrors are expected (user cancelled, component unmounted, or timeout)
  if (isAbortError(error)) {
    return {
      isExpected: true,
      userMessage: null, // Don't show message for expected cancellations
      shouldLog: false, // Don't log to console
      shouldRetry: false
    };
  }

  // Network errors should be retried
  if (isNetworkError(error)) {
    return {
      isExpected: false,
      userMessage: `Network connection issue. Please check your internet connection.`,
      shouldLog: true,
      shouldRetry: true
    };
  }

  // Timeout errors should be retried
  if (isTimeoutError(error)) {
    return {
      isExpected: false,
      userMessage: `Request timed out. The server might be experiencing high load.`,
      shouldLog: true,
      shouldRetry: true
    };
  }

  // Generic error
  return {
    isExpected: false,
    userMessage: error instanceof Error ? error.message : `Failed to complete ${context}`,
    shouldLog: true,
    shouldRetry: false
  };
}

/**
 * Create a fetch wrapper with timeout and abort handling
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {},
  onTimeout?: () => void
): Promise<Response> {
  const { timeout = 15000, ...fetchOptions } = options;

  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
    if (onTimeout) {
      onTimeout();
    }
  }, timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Only re-throw as timeout error if it was actually a timeout
    // If it was a manual abort (signal from parent), keep the original error
    if (isAbortError(error) && timedOut) {
      const timeoutError: ExtendedError = new Error('Request timed out');
      // Mark as timeout for better error handling
      timeoutError.isTimeout = true;
      timeoutError.isHandled = true; // Mark as handled to reduce console noise

      // In development, add helpful context
      if (isDevelopment()) {
        timeoutError.devNote = `This timeout is being handled gracefully. The user will see a retry dialog.`;
      }

      throw timeoutError;
    }
    throw error;
  }
}

/**
 * Silent abort - abort a controller without throwing errors
 */
export function silentAbort(controller: AbortController | null): void {
  try {
    if (controller) {
      controller.abort();
    }
  } catch {
    // Intentionally suppress abort errors
    // These are expected during cleanup
  }
}
