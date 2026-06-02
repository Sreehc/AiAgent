export type ApiError = {
  code: string;
  message: string;
  requestId?: string;
};

export type SessionItem = {
  sessionId: string;
  title: string;
  agentMode: "REACT" | "PLAN_EXECUTE";
  status: "IDLE" | "RUNNING" | "COMPLETED" | "FAILED";
  createdAt: string;
};

export type SessionListResponse = {
  pageNo: number;
  pageSize: number;
  items: SessionItem[];
};

export type RunItem = {
  runId: string;
  query: string;
  executionMode: "REACT" | "PLAN_EXECUTE";
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  knowledgeBaseIds: string[];
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
};

export type PlanStepItem = {
  stepNo: number;
  title: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  toolName: string | null;
  toolInput: string | null;
  toolOutput: string | null;
};

export type ArtifactItem = {
  artifactId: string;
  artifactType: "REPORT";
  title: string;
  content: string;
  createdAt: string;
};

export type SessionDetailResponse = {
  session: SessionItem;
  runs: RunItem[];
  planSteps: PlanStepItem[];
  toolInvocations: ToolInvocationItem[];
  artifacts: ArtifactItem[];
  summary: string | null;
  knowledgeBaseIds: string[];
};

export type KnowledgeBaseItem = {
  kbId: string;
  name: string;
  description: string | null;
  status: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeDocumentItem = {
  documentId: string;
  fileName: string;
  fileType: string;
  parseStatus: string;
  storageUri: string;
  chunkCount: number;
  createdAt: string;
};

export type SearchHit = {
  kbId: string;
  documentId: string;
  fileName: string;
  chunkId: string;
  chunkNo: number;
  contentPreview: string;
  score: number;
};

export type ToolInvocationItem = {
  toolCallId: string;
  toolName: string;
  toolType: string;
  status: string;
  requestPayload: string;
  responsePayload: string | null;
  startedAt: string;
  endedAt: string | null;
};

export type McpServerItem = {
  serverCode: string;
  name: string;
  transportType: "SSE" | "STDIO" | "STREAMABLE_HTTP";
  endpoint: string;
  commandLine: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
};

export type McpToolDescriptor = {
  toolName: string;
  toolType: string;
  description: string;
};

export type McpDiscoverResponse = {
  serverCode: string;
  tools: McpToolDescriptor[];
  cached: boolean;
};

export type McpHealthResponse = {
  serverCode: string;
  status: string;
  message: string;
};

export type SessionStreamEvent = {
  event: string;
  data: Record<string, unknown>;
};

type ApiResponse<T> = {
  code: string;
  message: string;
  data: T;
};

const API_PREFIX = "/api/v1";

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string | null
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    throw error ?? {
      code: "NETWORK_ERROR",
      message: `Request failed with status ${response.status}`
    };
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}

export async function streamRequest(
  path: string,
  body: unknown,
  accessToken: string,
  onEvent: (event: SessionStreamEvent) => void
) {
  const response = await fetch(`${API_PREFIX}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      Accept: "text/event-stream"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    throw error ?? {
      code: "NETWORK_ERROR",
      message: `Request failed with status ${response.status}`
    };
  }

  if (!response.body) {
    throw {
      code: "NETWORK_ERROR",
      message: "No stream body returned"
    } satisfies ApiError;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const parsed = parseEventChunk(chunk);
      if (parsed) {
        onEvent(parsed);
      }
    }
  }

  if (buffer.trim()) {
    const parsed = parseEventChunk(buffer);
    if (parsed) {
      onEvent(parsed);
    }
  }
}

function parseEventChunk(chunk: string): SessionStreamEvent | null {
  const lines = chunk
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  const raw = dataLines.join("\n");
  const parsed = JSON.parse(raw) as SessionStreamEvent;
  return {
    event: parsed.event || eventName,
    data: parsed.data ?? {}
  };
}
