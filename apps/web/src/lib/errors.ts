/**
 * Error handling pre BlackRent API
 * Centralizované spracovanie chýb z backendu
 */

/**
 * Štandardný formát error response z backendu
 */
export interface ErrorResponse {
  code: string;
  message: string;
  requestId?: string;
  details?: Record<string, unknown>;
  status?: number;
}

/**
 * Vlastná error klasa pre API chyby
 * Rozširuje Error o dodatočné informácie z backendu
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly requestId?: string;
  public readonly status?: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    options?: {
      requestId?: string;
      status?: number;
      details?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.requestId = options?.requestId;
    this.status = options?.status;
    this.details = options?.details;

    // Zachovanie stack trace v V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Vytvorí ApiError z ErrorResponse objektu
   */
  static fromErrorResponse(errorResponse: ErrorResponse): ApiError {
    return new ApiError(errorResponse.code, errorResponse.message, {
      requestId: errorResponse.requestId,
      status: errorResponse.status,
      details: errorResponse.details,
    });
  }

  /**
   * Vytvorí ApiError z HTTP response
   */
  static async fromResponse(response: Response): Promise<ApiError> {
    let errorData: ErrorResponse;

    try {
      const text = await response?.text?.();
      if (!text) {
        // Prázdna odpoveď
        errorData = {
          code: 'EMPTY_RESPONSE',
          message: `HTTP ${response?.status}: ${response?.statusText}`,
          status: response?.status,
        };
      } else {
        try {
          errorData = JSON.parse(text) as ErrorResponse;
        } catch {
          // Nie je JSON, použij text ako message
          errorData = {
            code: 'INVALID_JSON_RESPONSE',
            message: text,
            status: response?.status,
          };
        }
      }
    } catch {
      // Problém s čítaním response
      errorData = {
        code: 'RESPONSE_READ_ERROR',
        message: `HTTP ${response?.status}: ${response?.statusText}`,
        status: response?.status,
      };
    }

    return ApiError.fromErrorResponse(errorData);
  }

  /**
   * Serializable reprezentácia pre logging
   */
  toJSON(): ErrorResponse {
    return {
      code: this.code,
      message: this.message,
      requestId: this.requestId,
      status: this.status,
      details: this.details,
    };
  }
}
