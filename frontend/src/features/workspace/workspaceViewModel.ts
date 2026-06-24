import {
  ArtifactItem,
  PlanStepItem,
  RunItem,
  SessionDetailResponse,
  SessionStreamEvent,
  ToolInvocationItem
} from "../../services/api";

export type TimelineStatus = "PENDING" | "RUNNING" | "PAUSED" | "CANCEL_REQUESTED" | "CANCELLED" | "COMPLETED" | "FAILED" | "TIMED_OUT" | string;
export type AgentFeedKind = "run" | "plan-step" | "tool" | "artifact" | "stream-event";

export const AGENT_FEED_KIND_LABELS: Record<AgentFeedKind, string> = {
  run: "Run",
  "plan-step": "Plan step",
  tool: "Tool",
  artifact: "Artifact",
  "stream-event": "Live event"
};

export type ExecutionTimelineItem = {
  id: string;
  kind: AgentFeedKind;
  title: string;
  status: TimelineStatus;
  timestamp: string | null;
  detail: string | null;
  metadata: Array<{ label: string; value: string }>;
  payload: string | null;
};

export type LiveStreamItem = {
  id: string;
  event: string;
  createdAt: string;
  payload: Record<string, unknown>;
};

export function buildExecutionTimeline(detail: SessionDetailResponse | null, liveEvents: LiveStreamItem[] = []): ExecutionTimelineItem[] {
  if (!detail && liveEvents.length === 0) return [];

  return [
    ...(detail?.runs.map(mapRun) ?? []),
    ...(detail?.planSteps.map(mapPlanStep) ?? []),
    ...(detail?.toolInvocations.map(mapToolInvocation) ?? []),
    ...(detail?.artifacts.map(mapArtifact) ?? []),
    ...liveEvents.map(mapLiveEvent)
  ].sort((left, right) => compareTimestamp(left.timestamp, right.timestamp));
}

export function normalizeStreamEvent(event: SessionStreamEvent): LiveStreamItem {
  return {
    id: `${event.event}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    event: event.event,
    createdAt: new Date().toISOString(),
    payload: event.data
  };
}

export function previewPayload(value: unknown, maxLength = 1200): string | null {
  if (value === null || value === undefined || value === "") return null;
  const raw = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return raw.length > maxLength ? `${raw.slice(0, maxLength)}\n…` : raw;
}

function mapRun(run: RunItem): ExecutionTimelineItem {
  return {
    id: `run-${run.runId}`,
    kind: "run",
    title: run.query,
    status: run.status,
    timestamp: run.startedAt,
    detail: run.errorMessage,
    metadata: [
      { label: "模式", value: run.executionMode },
      { label: "知识库", value: `${run.knowledgeBaseIds.length}` },
      { label: "召回", value: `${run.recallSet.length}` },
      { label: "最终证据", value: `${run.finalEvidenceSet.length}` }
    ],
    payload: previewPayload(run.retrievalQuery)
  };
}

function mapPlanStep(step: PlanStepItem): ExecutionTimelineItem {
  return {
    id: `plan-${step.stepNo}-${step.title}`,
    kind: "plan-step",
    title: `${step.stepNo}. ${step.title}`,
    status: step.status,
    timestamp: null,
    detail: step.toolName ? `工具：${step.toolName}` : "未调用工具",
    metadata: [],
    payload: previewPayload(step.toolOutput ?? step.toolInput)
  };
}

function mapToolInvocation(tool: ToolInvocationItem): ExecutionTimelineItem {
  return {
    id: `tool-${tool.toolCallId}`,
    kind: "tool",
    title: tool.toolName,
    status: tool.status,
    timestamp: tool.startedAt,
    detail: tool.toolType,
    metadata: tool.endedAt ? [{ label: "结束", value: tool.endedAt }] : [],
    payload: previewPayload(tool.responsePayload ?? tool.requestPayload)
  };
}

function mapArtifact(artifact: ArtifactItem): ExecutionTimelineItem {
  return {
    id: `artifact-${artifact.artifactId}`,
    kind: "artifact",
    title: artifact.title,
    status: "COMPLETED",
    timestamp: artifact.createdAt,
    detail: artifact.artifactType,
    metadata: artifact.mimeType ? [{ label: "类型", value: artifact.mimeType }] : [],
    payload: previewPayload(artifact.content, 600)
  };
}

function mapLiveEvent(event: LiveStreamItem): ExecutionTimelineItem {
  return {
    id: event.id,
    kind: "stream-event",
    title: event.event,
    status: inferEventStatus(event.event),
    timestamp: event.createdAt,
    detail: "实时事件",
    metadata: [],
    payload: previewPayload(event.payload)
  };
}

function inferEventStatus(eventName: string): TimelineStatus {
  if (eventName.endsWith(".cancelled")) return "CANCELLED";
  if (eventName.endsWith(".cancel_requested")) return "CANCEL_REQUESTED";
  if (eventName.endsWith(".paused")) return "PAUSED";
  if (eventName.endsWith(".timed_out")) return "TIMED_OUT";
  if (eventName.endsWith(".failed") || eventName.endsWith(".error")) return "FAILED";
  if (eventName.endsWith(".completed") || eventName.endsWith(".done")) return "COMPLETED";
  return "RUNNING";
}

function compareTimestamp(left: string | null, right: string | null) {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return new Date(left).getTime() - new Date(right).getTime();
}
