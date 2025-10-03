/**
 * @param {string} inputString
 */
export async function compressAndBase64Encode(inputString) {
  const inputArray = new Blob([inputString]);

  const compressionStream = new CompressionStream("deflate-raw");

  const compressedStream = new Response(
    inputArray.stream().pipeThrough(compressionStream),
  ).arrayBuffer();

  const compressed = await compressedStream;
  const hashBuffer = await globalThis.crypto.subtle.digest(
    "SHA-256",
    compressed,
  );
  const hashArray = [...new Uint8Array(hashBuffer)].slice(0, 20);
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  const state = bytesToBase64(compressed);

  return { state, hash };
}

/**
 * @param {ArrayBuffer} bytes
 */
function bytesToBase64(bytes) {
  const binString = Array.from(new Uint8Array(bytes), (byte) =>
    String.fromCodePoint(byte),
  ).join("");
  return btoa(binString);
}