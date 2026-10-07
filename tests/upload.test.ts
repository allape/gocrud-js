import { describe, expect, test } from "@jest/globals";
import { sha256ToHex, upload } from "../";

describe("test upload", () => {
  test("post", async () => {
    const context = `1234abcd_${Math.random()}`;
    const hash = await sha256ToHex(context);
    const fakePath = `/js1/${hash}.txt`;
    const acutalPath = `/${hash.substring(0, 2)}/${hash.substring(2, 4)}/${hash}.txt`;
    const blob = new Blob([context], { type: "text/plain" });

    const savedPath = await upload(
      `http://localhost:8080/static${fakePath}`,
      blob,
    );
    expect(savedPath).toBe(acutalPath);

    const res = await fetch(`http://localhost:8080/static${savedPath}`);
    const text = await res.text();
    expect(text).toBe(context);
  });
});
