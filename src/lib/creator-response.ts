export const CREATOR_RESPONSE_MAX_BYTES = 1_048_576;

export type CreatorResponseRead =
  | { ok: true; text: string }
  | { ok: false; text: ''; error: string };

export async function readCreatorResponseText(
  response: Response,
  maxBytes = CREATOR_RESPONSE_MAX_BYTES,
): Promise<CreatorResponseRead> {
  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > maxBytes) {
    return {
      ok: false,
      text: '',
      error: `Creator response exceeds ${maxBytes} bytes`,
    };
  }

  if (!response.body) {
    const text = await response.text();
    if (Buffer.byteLength(text, 'utf8') <= maxBytes) {
      return { ok: true, text };
    }
    return {
      ok: false,
      text: '',
      error: `Creator response exceeds ${maxBytes} bytes`,
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let bytesRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        await reader.cancel();
        return {
          ok: false,
          text: '',
          error: `Creator response exceeds ${maxBytes} bytes`,
        };
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return { ok: true, text: chunks.join('') };
  } finally {
    reader.releaseLock();
  }
}
