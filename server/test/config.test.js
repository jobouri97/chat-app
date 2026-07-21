import assert from "node:assert/strict";
import test from "node:test";

process.env.JWT_SECRET ||= "test-secret-that-is-long-enough-for-tests";
process.env.DB_HOST ||= "localhost";
process.env.DB_USER ||= "test";
process.env.DB_PASSWORD ||= "test";
process.env.DB_NAME ||= "test";
process.env.CLIENT_ORIGINS = "https://chat.example.com,https://admin.example.com/";

const { config, isAllowedOrigin } = await import("../config.js");

test("normalizes configured client origins", () => {
  assert.deepEqual(config.clientOrigins, [
    "https://chat.example.com",
    "https://admin.example.com",
  ]);
});

test("allows configured and server-to-server origins only", () => {
  assert.equal(isAllowedOrigin("https://chat.example.com"), true);
  assert.equal(isAllowedOrigin("https://admin.example.com/"), true);
  assert.equal(isAllowedOrigin("https://attacker.example.com"), false);
  assert.equal(isAllowedOrigin(undefined), true);
});
