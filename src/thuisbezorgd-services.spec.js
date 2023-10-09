const service = require("./thuisbezorgd-services");
const {describe, it, expect} = require("@jest/globals");

describe("thuisbezorgd services", () => {

  it("Initialize component", () => {
    expect(!!service).toBe(true);
  });

});
