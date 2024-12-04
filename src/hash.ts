export async function sha256(
  data: string | Blob | BufferSource,
): Promise<ArrayBuffer> {
  if (typeof data === "string") {
    data = await new Blob([data], { type: "text/plain" }).arrayBuffer();
  } else if (data instanceof File) {
    data = await data.arrayBuffer();
  } else if (data instanceof Blob) {
    data = await data.arrayBuffer();
  }
  return crypto.subtle.digest("SHA-256", data as ArrayBuffer);
}

export async function sha256ToHex(
  data: string | Blob | BufferSource,
): Promise<string> {
  const buffer = await sha256(data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
