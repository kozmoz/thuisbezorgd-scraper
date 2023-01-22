import {ErrorCode} from "./error-code";

export interface IResponseError {

  /**
   * eg 'INVALID_ORDER_ID'.
   */
  errorCode: ErrorCode;

  /**
   * Human-readable description of the error; eg: 'Confirm order failed because of invalid orderId format 99999ZZZ'.
   */
  errorMessage?: string;

  /**
   * In case of HTTP error, the HTTP response status code.
   */
  httpStatusCode?: number;
}
