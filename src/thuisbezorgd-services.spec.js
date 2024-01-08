const service = require("./thuisbezorgd-services");
const {describe, it, expect} = require("@jest/globals");

describe("thuisbezorgd services", () => {

  it("Initialize component", () => {
    expect(!!service).toBe(true);
  });


  describe("isConnectionError", () => {

    it("should recognize connection errors", () => {
      const errors = ["socket hang up" /* exact match. */, "There is a ECONNRESET", "Any SSLV3_ALERT_HANDSHAKE_FAILURE Error"];
      errors.forEach(error =>
        expect(service._isConnectionError(error)).toBeTruthy()
      );
    });

    it("should recognize non-connection errors", () => {
      const errors = ["EACCES", "ENOENT", "ENOTFOUND"];
      errors.forEach(error =>
        expect(service._isConnectionError(error)).toBeFalsy()
      );
    });

    it("should handle empty strings and undefined", () => {
      expect(service._isConnectionError("")).toBeFalsy();
      expect(service._isConnectionError(undefined)).toBeFalsy();
    });

  });
});
