/**
 * Network Analyzer Utility
 * Detects network status and provides user-friendly error messages
 */

export interface NetworkStatus {
  online: boolean;
  type: 'offline' | 'server-error' | 'timeout' | 'cors' | 'unknown';
  message: string;
  suggestion: string;
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Analyze fetch error and return user-friendly message
 */
export function analyzeNetworkError(error: unknown): NetworkStatus {
  let errorMsg = '';

  if (error instanceof Error) {
    errorMsg = error.message.toLowerCase();
  } else if (typeof error === 'string') {
    errorMsg = error.toLowerCase();
  } else if (error && typeof error === 'object') {
    errorMsg = JSON.stringify(error).toLowerCase();
  } else {
    errorMsg = 'unknown error';
  }
  
  // Check browser online status first
  if (!isOnline()) {
    return {
      online: false,
      type: 'offline',
      message: 'No Internet Connection',
      suggestion: 'Please check your internet connection and try again.',
    };
  }

  // Network/Fetch errors
  if (errorMsg.includes('failed to fetch') || errorMsg.includes('networkerror') || errorMsg.includes('network error')) {
    return {
      online: false,
      type: 'offline',
      message: 'Connection Failed',
      suggestion: 'Unable to reach the server. Check your internet connection or try again later.',
    };
  }

  // Timeout errors
  if (errorMsg.includes('timeout') || errorMsg.includes('timed out') || errorMsg.includes('aborted')) {
    return {
      online: true,
      type: 'timeout',
      message: 'Request Timeout',
      suggestion: 'The server is taking too long to respond. Please try again.',
    };
  }

  // CORS errors
  if (errorMsg.includes('cors') || errorMsg.includes('cross-origin')) {
    return {
      online: true,
      type: 'cors',
      message: 'Access Blocked',
      suggestion: 'The request was blocked by browser security. Try refreshing the page.',
    };
  }

  // Server errors (5xx)
  if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503') || errorMsg.includes('504')) {
    return {
      online: true,
      type: 'server-error',
      message: 'Server Error',
      suggestion: 'Our server is having issues. Please try again in a few minutes.',
    };
  }

  // DNS/Connection refused
  if (errorMsg.includes('dns') || errorMsg.includes('enotfound') || errorMsg.includes('econnrefused')) {
    return {
      online: false,
      type: 'offline',
      message: 'Server Unreachable',
      suggestion: 'Cannot connect to the server. Check your internet or try again later.',
    };
  }

  // Default unknown error
  return {
    online: true,
    type: 'unknown',
    message: 'Something Went Wrong',
    suggestion: 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Check if error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  const status = analyzeNetworkError(error);
  return status.type === 'offline' || status.type === 'timeout' || status.type === 'server-error';
}

/**
 * Wrapper for fetch with network error handling and retry logic
 */
export async function fetchWithNetworkCheck<T>(
  url: string,
  options?: RequestInit,
  maxRetries: number = 3
): Promise<{ success: true; data: T } | { success: false; networkError: NetworkStatus }> {
  // Pre-check online status
  if (!isOnline()) {
    return {
      success: false,
      networkError: {
        online: false,
        type: 'offline',
        message: 'No Internet Connection',
        suggestion: 'Please check your internet connection and try again.',
      },
    };
  }

  let lastError: Error | NetworkStatus | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        // Server returned error status
        if (response.status >= 500) {
          // Transient errors - retry
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          lastError = {
            online: true,
            type: 'server-error',
            message: 'Server Error',
            suggestion: 'Our server is having issues. Please try again in a few minutes.',
          };
          break;
        } else if (response.status === 429) {
          // Rate limit - retry
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 2000; // Longer backoff for rate limit
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
        } else if (response.status >= 400) {
          // Client errors - don't retry
          const errorMsg = await response.text().catch(() => 'Request failed');
          lastError = new Error(`HTTP ${response.status}: ${errorMsg}`);
          break;
        }
      }

      // Try to parse as JSON, fallback to text if not JSON
      let data: T;
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // For non-JSON responses, return response object itself
        data = response as any;
      }

      return { success: true, data };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if it's a transient error worth retrying
      const isTransient = error instanceof Error && (
        error.name === 'AbortError' ||
        error.message.includes('timeout') ||
        error.message.includes('timed out') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      );

      if (isTransient && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      // Not transient or last attempt
      break;
    }
  }

  // Return the last error
  if (lastError instanceof Error) {
    return {
      success: false,
      networkError: analyzeNetworkError(lastError),
    };
  } else if (lastError && typeof lastError === 'object') {
    return {
      success: false,
      networkError: lastError as NetworkStatus,
    };
  }

  return {
    success: false,
    networkError: {
      online: true,
      type: 'unknown',
      message: 'Request Failed',
      suggestion: 'An unexpected error occurred. Please try again.',
    },
  };
}
