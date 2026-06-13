export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "NOT_FOUND":
        return "Note not found or already retrieved.";
      case "EXPIRED":
        return "This note has expired and been destroyed.";
      case "VALIDATION_ERROR":
        return error.message;
      case "RATE_LIMITED":
        return "Too many requests. Please try again later.";
      case "UNAUTHORIZED":
        return "Invalid email or password.";
      case "CONFLICT":
        return "An account with this email already exists.";
      case "FORBIDDEN":
        return error.message || "You don't have permission to perform this action.";
      default:
        return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}