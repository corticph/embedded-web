interface ValidationError {
  expected?: string;
  code?: string;
  path?: string[];
  message?: string;
}

interface FormattedError {
  message: string;
  code?: string;
  details?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Attempts to parse a JSON string safely
 */
function tryParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Extracts a 3-digit HTTP status code from an error message
 */
function extractStatusCode(message: string): string | undefined {
  // Match 3-digit numbers that look like HTTP status codes (100-599)
  const statusCodeMatch = message.match(/\b([1-5]\d{2})\b/);
  return statusCodeMatch ? statusCodeMatch[1] : undefined;
}

/**
 * Checks if an object looks like a validation error
 */
function isValidationError(obj: unknown): obj is ValidationError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ('expected' in obj || 'code' in obj || 'path' in obj || 'message' in obj)
  );
}

/**
 * Formats a validation error into a human-readable message
 */
function formatValidationError(error: ValidationError): string {
  const { path, expected, message, code } = error;

  // Use the provided message if available
  if (message) {
    return message;
  }

  // Build a descriptive message from the parts
  const pathString = path && path.length > 0 ? path.join('.') : 'field';

  if (expected) {
    return `Invalid ${pathString}: expected ${expected}`;
  }

  if (code) {
    return `Validation error in ${pathString} (${code})`;
  }

  return `Validation error in ${pathString}`;
}

/**
 * Formats multiple validation errors into a single message
 */
function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return 'Unknown validation error';
  }

  if (errors.length === 1) {
    return formatValidationError(errors[0]);
  }

  const errorMessages = errors.map(formatValidationError);
  return `Multiple validation errors: ${errorMessages.join('; ')}`;
}

/**
 * Generic error formatter that handles various error formats
 */
export function formatError(
  error: unknown,
  fallbackMessage = 'An error occurred',
): FormattedError {
  // Handle null/undefined
  if (!error) {
    return {
      message: fallbackMessage,
      details: error,
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    const extractedCode = extractStatusCode(error.message);
    return {
      message: error.message || fallbackMessage,
      code: extractedCode,
      details: error,
    };
  }

  // Handle string errors (like "400 Bad Request")
  if (typeof error === 'string') {
    const extractedCode = extractStatusCode(error);
    return {
      message: error,
      code: extractedCode,
      details: error,
    };
  }

  // Handle arrays (direct validation error arrays)
  if (Array.isArray(error)) {
    // Check if it's an array of validation errors
    if (error.every(isValidationError)) {
      const validationErrors = error as ValidationError[];
      return {
        message: formatValidationErrors(validationErrors),
        code: validationErrors[0]?.code, // Use the first error's code if available
        details: error,
      };
    }

    // Handle other arrays
    return {
      message: `Multiple errors: ${error.length} item(s)`,
      details: error,
    };
  }

  // Handle error objects
  if (isRecord(error)) {
    const errorObj = error;
    const objectMessage =
      typeof errorObj.message === 'string' ? errorObj.message : undefined;
    const objectCode =
      typeof errorObj.code === 'string' ? errorObj.code : undefined;
    const objectStatus =
      typeof errorObj.status === 'string'
        ? errorObj.status
        : typeof errorObj.status === 'number'
          ? String(errorObj.status)
          : undefined;

    // Handle objects with message and details structure (your original case)
    if (objectMessage) {
      let formattedMessage = objectMessage;
      let code = objectCode;

      // If no code is provided, try to extract it from the message
      if (!code) {
        code = extractStatusCode(formattedMessage);
      }

      // Try to enhance the message with parsed details
      if (
        isRecord(errorObj.details) &&
        typeof errorObj.details.message === 'string'
      ) {
        const parsedDetails = tryParseJson(errorObj.details.message);

        // Check if parsed details is an array of validation errors
        if (
          Array.isArray(parsedDetails) &&
          parsedDetails.every(isValidationError)
        ) {
          formattedMessage = formatValidationErrors(
            parsedDetails as ValidationError[],
          );
        }
      }

      return {
        message: formattedMessage,
        code,
        details: errorObj.details,
      };
    }

    // Handle single validation error objects
    if (
      'expected' in errorObj ||
      'code' in errorObj ||
      'path' in errorObj ||
      'message' in errorObj
    ) {
      const validationError: ValidationError = {
        expected:
          typeof errorObj.expected === 'string' ? errorObj.expected : undefined,
        code: objectCode,
        path:
          Array.isArray(errorObj.path) &&
          errorObj.path.every(pathPart => typeof pathPart === 'string')
            ? errorObj.path
            : undefined,
        message: objectMessage,
      };
      return {
        message: formatValidationError(validationError),
        code: validationError.code,
        details: error,
      };
    }

    // Handle objects that might have useful error info
    if (errorObj.error || errorObj.detail || objectStatus || objectCode) {
      const message = errorObj.error ?? objectMessage ?? errorObj.detail;
      const messageStr =
        typeof message === 'string' ? message : fallbackMessage;

      // Try to get code from various properties, or extract from message
      let code = objectCode ?? objectStatus;
      if (!code && typeof message === 'string') {
        code = extractStatusCode(message);
      }

      return {
        message: messageStr,
        code,
        details: error,
      };
    }
  }

  // Fallback for any other case
  return {
    message: fallbackMessage,
    details: error,
  };
}
