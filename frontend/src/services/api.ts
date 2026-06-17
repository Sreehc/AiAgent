export type ApiError = {
  code: string;
  message: string;
  requestId?: string;
};

export type SessionItem = {
  sessionId: string;
  title: string;
  agentMode: "REACT" | "PLAN_EXECUTE";
  status: "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCELLED" | "TIMED_OUT";
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
  retrievalQuery: string | null;
  executionMode: "REACT" | "PLAN_EXECUTE";
  status: "PENDING" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCEL_REQUESTED" | "CANCELLED" | "TIMED_OUT";
  knowledgeBaseIds: string[];
  recallSet: EvidenceItem[];
  finalEvidenceSet: EvidenceItem[];
  startedAt: string | null;
  completedAt: string | null;
  heartbeatAt: string | null;
  cancelRequestedAt: string | null;
  cancelReason: string | null;
  pausedAt: string | null;
  pauseReason: string | null;
  resumedAt: string | null;
  timeoutAt: string | null;
  recoveredAt: string | null;
  strategySource: string | null;
  planningRounds: number;
  fallbackReasonsJson: string | null;
  errorMessage: string | null;
};

export type PlanStepItem = {
  stepNo: number;
  title: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED" | "CANCELLED";
  toolName: string | null;
  toolInput: string | null;
  toolOutput: string | null;
  observation?: string | null;
  completionJudgement?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
};

export type ArtifactItem = {
  artifactId: string;
  artifactType: "REPORT" | "IMAGE" | "IMAGE_REFERENCE" | "ATTACHMENT" | "TOOL_OUTPUT" | "CONTEXT_SNIPPET";
  title: string;
  content: string;
  storageUri: string | null;
  mimeType: string | null;
  resultUrl: string | null;
  metadata?: string | null;
  sourceArtifactId?: number | null;
  reusable?: boolean;
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
  versionNo: number;
  fileSize: number;
  lastError: string | null;
  createdAt: string;
};

export type EvidenceItem = {
  citationId: string;
  kbId: string;
  documentId: string;
  fileName: string;
  chunkId: string;
  chunkNo: number;
  sourceOffset: number;
  rank: number;
  sectionTitle: string | null;
  headingPath: string | null;
  retrievalStrategy: string;
  score: number;
  contentPreview: string;
};

export type SearchHit = EvidenceItem & {
  tokenCount: number;
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
  endpoint: string | null;
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
  latencyMs: number | null;
  toolCount: number;
  transportType: string;
  errorCode: string | null;
  checkedAt: string;
};

export type ModelConfigItem = {
  id: number;
  modelCode: string;
  name: string;
  provider: string;
  modelType: "CHAT" | "EMBEDDING" | "IMAGE";
  baseUrl: string;
  apiKeyMasked: string | null;
  enabled: boolean;
  defaultModel: boolean;
  lastTestStatus: string | null;
  lastTestMessage: string | null;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminAuditRow = Record<string, unknown>;

export type RagEvaluationItem = {
  evalId: string;
  knowledgeBaseIds: string;
  cases: string;
  metrics: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type RagEvaluationCaseItem = {
  caseId: string;
  query: string;
  expectedCitationIds: string[];
  expectedTextContains: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InviteItem = {
  inviteToken: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export type ImageGenerationItem = {
  jobId: string;
  mode: "IMAGES" | "EDITS";
  size: string;
  sessionId: string | null;
  sourceArtifactId: string | null;
  artifactId: string;
  title: string;
  storageUri: string;
  mimeType: string;
  resultUrl: string | null;
  createdAt: string;
};

export type ImageHistoryItem = {
  jobId: string;
  mode: "IMAGES" | "EDITS";
  prompt: string;
  size: string;
  sessionId: string | null;
  sourceArtifactId: string | null;
  resultArtifactId: string | null;
  status: "COMPLETED" | "FAILED";
  errorMessage: string | null;
  resultUrl: string | null;
  createdAt: string;
};

export type ImageHistoryResponse = {
  pageNo: number;
  pageSize: number;
  items: ImageHistoryItem[];
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

const SESSION_STORAGE_KEY = "aiagent.auth.session";
const SESSION_CHANGE_EVENT = "aiagent.auth.sessionchange";
let unauthorizedHandled = false;

function handleUnauthorized() {
  if (unauthorizedHandled) return;
  unauthorizedHandled = true;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  } finally {
    window.setTimeout(() => {
      unauthorizedHandled = false;
    }, 0);
  }
}

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value &&
    typeof (value as ApiError).code === "string" &&
    typeof (value as ApiError).message === "string"
  );
}

function toApiError(value: unknown, fallback: ApiError): ApiError {
  return isApiError(value) ? value : fallback;
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value &&
    "data" in value &&
    typeof (value as ApiResponse<T>).code === "string" &&
    typeof (value as ApiResponse<T>).message === "string"
  );
}

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
    if (response.status === 401 && accessToken) {
      handleUnauthorized();
    }
    const errorPayload = await response.json().catch(() => null);
    throw toApiError(errorPayload, {
      code: "NETWORK_ERROR",
      message: `Request failed with status ${response.status}`
    });
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!isApiResponse<T>(payload)) {
    throw {
      code: "RESPONSE_INVALID",
      message: "Response body does not match the API contract"
    } satisfies ApiError;
  }
  if (payload.code !== "SUCCESS") {
    throw {
      code: payload.code,
      message: payload.message || "Request failed"
    } satisfies ApiError;
  }
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
    if (response.status === 401) {
      handleUnauthorized();
    }
    const errorPayload = await response.json().catch(() => null);
    throw toApiError(errorPayload, {
      code: "NETWORK_ERROR",
      message: `Request failed with status ${response.status}`
    });
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
        if (isTerminalStreamEvent(parsed)) {
          await reader.cancel();
          return;
        }
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

function isTerminalStreamEvent(event: SessionStreamEvent) {
  return event.event === "session.completed" || event.event === "session.failed" || event.event === "request.failed";
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
