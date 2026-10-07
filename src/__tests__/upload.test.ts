import { expect, test } from "vitest";
import { upload, XFileDigestHeader } from "../index";
import { sha256ToHex } from "../sha256";

test("post", async () => {
  const context = `1234abcd_${Math.random()}`;
  const hash = await sha256ToHex(context);
  const fakePath = `/js1/${hash}.txt`;
  const acutalPath = `/${hash.substring(0, 2)}/${hash.substring(2, 4)}/${hash}.txt`;
  const blob = new Blob([context], { type: "text/plain" });

  const savedPath = await upload(
    `http://localhost:8080/static${fakePath}`,
    blob,
    undefined,
    {
      headers: {
        [XFileDigestHeader]: hash,
      },
    },
  );
  expect(savedPath).toBe(acutalPath);

  const res = await fetch(`http://localhost:8080/static${savedPath}`);
  const text = await res.text();
  expect(text).toBe(context);
});
