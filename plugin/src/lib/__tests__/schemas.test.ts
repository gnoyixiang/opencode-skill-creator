import { describe, it } from "node:test";
import assert from "node:assert";
import { SUPPORTED_ASSERTION_TYPES } from "../schemas.js";

describe("SUPPORTED_ASSERTION_TYPES", () => {
  it("contains the expected assertion types", () => {
    assert.ok(SUPPORTED_ASSERTION_TYPES.includes("contains"));
    assert.ok(SUPPORTED_ASSERTION_TYPES.includes("regex"));
    assert.ok(SUPPORTED_ASSERTION_TYPES.includes("json_schema"));
    assert.ok(SUPPORTED_ASSERTION_TYPES.includes("file_exists"));
    assert.ok(SUPPORTED_ASSERTION_TYPES.includes("file_contains"));
    assert.equal(SUPPORTED_ASSERTION_TYPES.length, 5);
  });
});
