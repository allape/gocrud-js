import { describe, test } from "@jest/globals";
import { upload } from "../src";
import { sha256ToHex } from '../src/hash';

describe("test upload", () => {
  test("post", async () => {
    const context = `1234abcd_${Math.random()}`;
    const fullFilename = `/js1/${await sha256ToHex(context)}.txt`;
    const blob = new Blob([context], { type: "text/plain" });

    const savedPath = await upload(
      `http://localhost:8080/static${fullFilename}`,
      blob,
    );
    expect(savedPath).toBe(fullFilename);

    const res = await fetch(`http://localhost:8080/static/${fullFilename}`);
    const text = await res.text();
    expect(text).toBe(context);
  });
});
