export const handleApiResponse = async (
  response: Response,
  defaultErrorMessage: string
) => {
  const contentType = response.headers.get("content-type");
  let errorData: unknown;

  if (contentType && contentType.includes("application/json")) {
    errorData = await response.json();
  } else {
    errorData = await response.text();
  }

  return {
    status: response.status,
    success: false,
    message:
      typeof errorData === "string"
        ? errorData
        : (errorData as { message?: string }).message || defaultErrorMessage,
    timestamp: new Date().toISOString(),
  };
};

export const safeJsonParse = async <T>(response: Response, fallback: T): Promise<{ parsed: T; ok: boolean; error?: string }> => {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      const data = await response.json();
      return { parsed: data as T, ok: true };
    } catch (e) {
      return { parsed: fallback, ok: false, error: e instanceof Error ? e.message : "Failed to parse JSON" };
    }
  }
  const text = await response.text();
  return { parsed: fallback, ok: false, error: text ? `Non-JSON response: ${text.slice(0, 200)}` : "Empty response body" };
};