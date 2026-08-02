export async function gzipText(value: string): Promise<Uint8Array> {
  const input = new TextEncoder().encode(value);
  const stream = new Blob([input]).stream().pipeThrough(
    new CompressionStream("gzip"),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function sha256Hex(value: ArrayBufferView | string): Promise<string> {
  const bytes = typeof value === "string"
    ? new TextEncoder().encode(value)
    : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  const digestInput = new Uint8Array(bytes.byteLength);
  digestInput.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", digestInput.buffer);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
