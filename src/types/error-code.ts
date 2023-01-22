export enum ErrorCode {
  NO_CREDENTIALS = "NO_CREDENTIALS",
  PARSE_ERROR = "PARSE_ERROR",
  /**
   * General HTTP error.
   */
  HTTP_ERROR = "HTTP_ERROR",
  HTTP_ERROR_CONNECTION = "socket hang up"
}
