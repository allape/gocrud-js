import { describe, expect, test } from "vitest";
import { sha256ToHex } from "../sha256";
import { upload, XFileDigestHeader } from "../upload";

describe("upload", () => {
  test("upload", async () => {
    const context = `upload_content_1234abcd_${Math.random()}`;
    const hash = await sha256ToHex(context);
    const actualPath = `/${hash.substring(0, 2)}/${hash.substring(2, 4)}/${hash}.txt`;
    try {
      const savedPath = await upload(
        `http://localhost:8080/static/1.txt`,
        context as unknown as File,
        {
          addDigestHeader: false,
          headers: {
            [XFileDigestHeader]: hash,
          },
        },
      );
      expect(savedPath).toBe(actualPath);

      const res = await fetch(`http://localhost:8080/static${savedPath}`);
      const text = await res.text();
      expect(text).toBe(context);
    } catch (e) {
      console.error(e);
      expect(e).toBeNull();
    }
  })

  test("custom digest header", async () => {
    const context = `1234abcd_${Math.random()}`;
    const hash = await sha256ToHex(context);
    const fakePath = `/js1/${hash}.txt`;
    const actualPath = `/${hash.substring(0, 2)}/${hash.substring(2, 4)}/${hash}.txt`;

    // Can not use Blob in test, because jsdom is injecting DOM codes into node,
    // which will be "[Object Blob]" for fetch func to write request body
    // const blob = new Blob([context], { type: "text/plain" });

    try {
      const savedPath = await upload(
        `http://localhost:8080/static${fakePath}`,
        context as unknown as File,
        {
          addDigestHeader: false,
          headers: {
            [XFileDigestHeader]: hash,
          },
        },
      );
      expect(savedPath).toBe(actualPath);

      const res = await fetch(`http://localhost:8080/static${savedPath}`);
      const text = await res.text();
      expect(text).toBe(context);
    } catch (e) {
      console.error(e);
      expect(e).toBeNull();
    }
  });
})
