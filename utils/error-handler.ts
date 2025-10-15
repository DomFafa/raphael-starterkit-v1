/**
 * Comprehensive error handling utility
 * Provides user-friendly error messages and proper error classification
 */

export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  PAYMENT = 'payment',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  NETWORK = 'network',
  INTERNAL = 'internal',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
  suggestions?: string[];
  retryable: boolean;
}

export interface ErrorResponse {
  error: string;
  userMessage: string;
  type: ErrorType;
  code?: string;
  details?: any;
  suggestions?: string[];
  retryable: boolean;
  timestamp: string;
  requestId?: string;
}

function isAppError(error: unknown): error is AppError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidate = error as Partial<AppError>;
  return typeof candidate.type === 'string' && typeof candidate.userMessage === 'string';
}

class ErrorHandler {
  /**
   * Create a standardized application error
   */
  static createError(
    type: ErrorType,
    userMessage: string,
    technicalMessage?: string,
    options: {
      code?: string;
      details?: any;
      suggestions?: string[];
      retryable?: boolean;
      severity?: ErrorSeverity;
    } = {}
  ): AppError {
    return {
      type,
      severity: options.severity || this.getDefaultSeverity(type),
      message: technicalMessage || userMessage,
      userMessage,
      code: options.code,
      details: options.details,
      suggestions: options.suggestions,
      retryable: options.retryable ?? this.getDefaultRetryable(type),
    };
  }

  /**
   * Handle unknown errors and convert them to AppError
   */
  static handleError(error: unknown, context?: string): AppError {
    if (isAppError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return this.classifyError(error, context);
    }

    // Handle unknown error types
    return this.createError(
      ErrorType.INTERNAL,
      'An unexpected error occurred. Please try again.',
      `Unknown error: ${String(error)}`,
      {
        severity: ErrorSeverity.HIGH,
        retryable: true,
        suggestions: ['Refresh the page and try again', 'Check your internet connection'],
      }
    );
  }

  /**
   * Classify common error types
   */
  private static classifyError(error: Error, context?: string): AppError {
    const message = error.message.toLowerCase();
    const contextLower = context?.toLowerCase() || '';

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('authentication') ||
        message.includes('invalid token') || message.includes('jwt')) {
      return this.createError(
        ErrorType.AUTHENTICATION,
        'Please sign in to continue.',
        error.message,
        {
          code: 'AUTH_REQUIRED',
          suggestions: ['Sign in to your account', 'Check if your session has expired'],
          retryable: false,
        }
      );
    }

    // Authorization errors
    if (message.includes('forbidden') || message.includes('access denied') ||
        message.includes('insufficient permissions')) {
      return this.createError(
        ErrorType.AUTHORIZATION,
        'You don\'t have permission to perform this action.',
        error.message,
        {
          code: 'ACCESS_DENIED',
          retryable: false,
        }
      );
    }

    // Rate limiting errors
    if (message.includes('rate limit') || message.includes('too many requests') ||
        message.includes('quota exceeded')) {
      return this.createError(
        ErrorType.RATE_LIMIT,
        'You\'ve made too many requests. Please wait a moment before trying again.',
        error.message,
        {
          code: 'RATE_LIMIT_EXCEEDED',
          suggestions: [
            'Wait a few minutes before trying again',
            'Consider upgrading your plan for higher limits',
          ],
          retryable: true,
          severity: ErrorSeverity.MEDIUM,
        }
      );
    }

    // Payment errors
    if (contextLower.includes('payment') || contextLower.includes('checkout') ||
        message.includes('payment') || message.includes('billing') || message.includes('creem')) {
      return this.createError(
        ErrorType.PAYMENT,
        'Payment processing failed. Please check your payment details and try again.',
        error.message,
        {
          code: 'PAYMENT_FAILED',
          suggestions: [
            'Check your payment method details',
            'Ensure you have sufficient funds',
            'Try a different payment method',
          ],
          retryable: true,
          severity: ErrorSeverity.HIGH,
        }
      );
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') ||
        message.includes('required') || message.includes('bad request')) {
      return this.createError(
        ErrorType.VALIDATION,
        'Please check your input and try again.',
        error.message,
        {
          code: 'VALIDATION_ERROR',
          suggestions: [
            'Double-check all form fields',
            'Ensure all required fields are filled',
            'Check for any invalid characters',
          ],
          retryable: false,
          severity: ErrorSeverity.LOW,
        }
      );
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch') ||
        message.includes('connection') || message.includes('timeout')) {
      return this.createError(
        ErrorType.NETWORK,
        'Connection problem. Please check your internet connection and try again.',
        error.message,
        {
          code: 'NETWORK_ERROR',
          suggestions: [
            'Check your internet connection',
            'Try refreshing the page',
            'Wait a moment and try again',
          ],
          retryable: true,
          severity: ErrorSeverity.MEDIUM,
        }
      );
    }

    // Database errors
    if (contextLower.includes('database') || contextLower.includes('supabase') ||
        message.includes('database') || message.includes('constraint') ||
        message.includes('duplicate')) {
      return this.createError(
        ErrorType.DATABASE,
        'Data storage error. Please try again.',
        error.message,
        {
          code: 'DATABASE_ERROR',
          retryable: true,
          severity: ErrorSeverity.HIGH,
        }
      );
    }

    // External service errors (OpenAI, etc.)
    if (contextLower.includes('openai') || contextLower.includes('generation') ||
        message.includes('openai') || message.includes('ai') || message.includes('api')) {
      return this.createError(
        ErrorType.EXTERNAL_SERVICE,
        'AI service is temporarily unavailable. Please try again in a few moments.',
        error.message,
        {
          code: 'EXTERNAL_SERVICE_ERROR',
          suggestions: [
            'Wait a few minutes and try again',
            'Try refreshing the page',
            'Contact support if the problem persists',
          ],
          retryable: true,
          severity: ErrorSeverity.MEDIUM,
        }
      );
    }

    // Default internal error
    return this.createError(
      ErrorType.INTERNAL,
      'Something went wrong. Please try again.',
      error.message,
      {
        severity: ErrorSeverity.HIGH,
        retryable: true,
        suggestions: ['Refresh the page and try again', 'Contact support if the problem persists'],
      }
    );
  }

  /**
   * Get default severity for error type
   */
  private static getDefaultSeverity(type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.VALIDATION:
        return ErrorSeverity.LOW;
      case ErrorType.RATE_LIMIT:
      case ErrorType.NETWORK:
      case ErrorType.EXTERNAL_SERVICE:
        return ErrorSeverity.MEDIUM;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
      case ErrorType.PAYMENT:
      case ErrorType.DATABASE:
        return ErrorSeverity.HIGH;
      case ErrorType.INTERNAL:
      default:
        return ErrorSeverity.CRITICAL;
    }
  }

  /**
   * Get default retryable value for error type
   */
  private static getDefaultRetryable(type: ErrorType): boolean {
    switch (type) {
      case ErrorType.VALIDATION:
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return false;
      case ErrorType.RATE_LIMIT:
      case ErrorType.NETWORK:
      case ErrorType.EXTERNAL_SERVICE:
      case ErrorType.DATABASE:
      case ErrorType.INTERNAL:
      default:
        return true;
    }
  }

  /**
   * Convert AppError to API response format
   */
  static toErrorResponse(error: AppError, requestId?: string): ErrorResponse {
    return {
      error: error.userMessage,
      userMessage: error.userMessage,
      type: error.type,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      suggestions: error.suggestions,
      retryable: error.retryable,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  /**
   * Get user-friendly messages for common scenarios
   */
  static getMessage(type: ErrorType, context?: string): string {
    switch (type) {
      case ErrorType.VALIDATION:
        return 'Please check your input and ensure all required fields are filled correctly.';
      case ErrorType.AUTHENTICATION:
        return 'Please sign in to continue with this action.';
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.';
      case ErrorType.RATE_LIMIT:
        return 'You\'ve reached the usage limit. Please wait before trying again.';
      case ErrorType.PAYMENT:
        return 'Payment failed. Please check your payment details and try again.';
      case ErrorType.EXTERNAL_SERVICE:
        return 'External service is temporarily unavailable. Please try again later.';
      case ErrorType.DATABASE:
        return 'Data operation failed. Please try again.';
      case ErrorType.NETWORK:
        return 'Connection problem. Please check your internet and try again.';
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorType.CONFLICT:
        return 'This action conflicts with existing data. Please refresh and try again.';
      case ErrorType.INTERNAL:
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Create specific error types with common patterns
   */
  static validationError(message: string, details?: any): AppError {
    return this.createError(
      ErrorType.VALIDATION,
      message,
      undefined,
      { details, retryable: false, severity: ErrorSeverity.LOW }
    );
  }

  static authenticationError(message?: string): AppError {
    return this.createError(
      ErrorType.AUTHENTICATION,
      message || 'Please sign in to continue.',
      undefined,
      { code: 'AUTH_REQUIRED', retryable: false }
    );
  }

  static rateLimitError(limit?: number, window?: string): AppError {
    const userMessage = limit
      ? `You can make ${limit} requests per ${window || 'minute'}. Please wait before trying again.`
      : 'Rate limit exceeded. Please wait before trying again.';

    return this.createError(
      ErrorType.RATE_LIMIT,
      userMessage,
      undefined,
      {
        code: 'RATE_LIMIT_EXCEEDED',
        retryable: true,
        severity: ErrorSeverity.MEDIUM,
        suggestions: [
          'Wait a moment before trying again',
          'Consider upgrading your plan for higher limits',
        ],
      }
    );
  }

  static externalServiceError(service: string, message?: string): AppError {
    return this.createError(
      ErrorType.EXTERNAL_SERVICE,
      `${service} is temporarily unavailable. Please try again later.`,
      message,
      {
        retryable: true,
        severity: ErrorSeverity.MEDIUM,
        suggestions: [
          'Wait a few minutes and try again',
          'Try refreshing the page',
        ],
      }
    );
  }
}

/**
 * Higher-order function to wrap API routes with error handling
 */
export function withErrorHandler(
  handler: (request: Request, ...args: any[]) => Promise<Response>
) {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      const errorResponse = ErrorHandler.toErrorResponse(
        appError,
        crypto.randomUUID()
      );

      // Log error for debugging
      console.error('API Error:', {
        type: appError.type,
        message: appError.message,
        userMessage: appError.userMessage,
        code: appError.code,
        timestamp: new Date().toISOString(),
      });

      // Return appropriate HTTP status
      const statusCode = getStatusCode(appError.type);

      return new Response(JSON.stringify(errorResponse), {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  };
}

/**
 * Get appropriate HTTP status code for error type
 */
function getStatusCode(type: ErrorType): number {
  switch (type) {
    case ErrorType.VALIDATION:
      return 400;
    case ErrorType.AUTHENTICATION:
      return 401;
    case ErrorType.AUTHORIZATION:
      return 403;
    case ErrorType.NOT_FOUND:
      return 404;
    case ErrorType.CONFLICT:
      return 409;
    case ErrorType.RATE_LIMIT:
      return 429;
    case ErrorType.INTERNAL:
    default:
      return 500;
  }
}

export default ErrorHandler;
