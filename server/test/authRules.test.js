const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateEmail,
  validatePassword,
  validateDisplayName,
  cleanVideoId,
  cleanHttpsUrl,
} = require("../src/authRules");

test("email validation", () => {
  assert.equal(validateEmail("  Ada@Example.com ").email, "ada@example.com");
  assert.ok(validateEmail("not-an-email").error);
  assert.ok(validateEmail("").error);
});

test("password validation", () => {
  assert.equal(validatePassword("singalong").password, "singalong");
  assert.equal(validatePassword("12345678").password, "12345678");
  assert.match(validatePassword("short").error, /8/);
});

test("display name validation", () => {
  assert.equal(validateDisplayName("  Ada   L. ").displayName, "Ada L.");
  assert.ok(validateDisplayName("   ").error);
  assert.ok(validateDisplayName("a".repeat(81)).error);
});

test("video id and avatar url", () => {
  assert.equal(cleanVideoId("dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(cleanVideoId("bad id"), null);
  assert.equal(cleanVideoId(""), null);
  assert.equal(cleanHttpsUrl(""), null);
  assert.equal(cleanHttpsUrl("http://example.com/a.png"), undefined);
  assert.equal(
    cleanHttpsUrl("https://example.com/a.png"),
    "https://example.com/a.png"
  );
});
