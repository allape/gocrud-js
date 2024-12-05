import { describe, test } from "@jest/globals";
import { sha256ToHex } from "../";

describe("test upload", () => {
  test("sha256", async () => {
    // echo "12345678" | shasum -a 256
    expect(await sha256ToHex("12345678")).toBe(
      "ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f",
    );
  });
});
