import { FormEvent, ReactNode, useState } from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import { ArtifactItem, SessionDetailResponse, ToolInvocationItem } from "../../services/api";
import { Alert, Badge, EmptyState, Skeleton, TabsContentState } from "../../components/ui";
import { ArtifactPanel } from "./ArtifactPanel";
import { EvidencePanel } from "./EvidencePanel";
import { MemoryPanel } from "./MemoryPanel";
import { ToolInvocationList } from "./ToolInvocationList";

type InspectorTab = "artifacts" | "evidence" | "memory" | "tools";
type InspectorContentState = "default" | "loading" | "empty" | "error";

const INSPECTOR_TABS: Array<{ id: InspectorTab; label: string }> = [
  { id: "artifacts", label: "产物" },
  { id: "evidence", label: "证据" },
  { id: "memory", label: "记忆" },
  { id: "tools", label: "工具" }
];

const EMPTY_COPY: Record<InspectorTab, { title: string; message: string }> = {
  artifacts: { title: "未选择会话", message: "选择或创建会话后，可查看报告、附件和可复用产物。" },
  evidence: { title: "未选择会话", message: "选择或创建会话后，可查看检索证据和引用来源。" },
  memory: { title: "未选择会话", message: "选择或创建会话后，可查看和编辑会话记忆。" },
  tools: { title: "未选择会话", message: "选择或创建会话后，可查看工具调用摘要和 payload 详情。" }
};

type WorkspaceInspectorProps = {
  detail: SessionDetailResponse | null;
  artifacts: ArtifactItem[];
  selected: boolean;
  loading?: boolean;
  error?: string | null;
  memoryContent: string;
  savingMemory: boolean;
  toolInvocations: ToolInvocationItem[];
  canRestore: boolean;
  onRestore: () => void;
  onUseArtifact: (artifact: ArtifactItem) => void;
  onUpload: (event: FormEvent<HTMLFormElement>) => void;
  onMemoryChange: (content: string) => void;
  onMemorySave: () => void;
  onMemoryClear: () => void;
  onMemoryRebuild: () => void;
};

export function WorkspaceInspector({
  detail,
  artifacts,
  selected,
  loading = false,
  error = null,
  memoryContent,
  savingMemory,
  toolInvocations,
  canRestore,
  onRestore,
  onUseArtifact,
  onUpload,
  onMemoryChange,
  onMemorySave,
  onMemoryClear,
  onMemoryRebuild
}: WorkspaceInspectorProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("artifacts");
  const contentState = getInspectorContentState({ selected, loading, error });
  const panels: Record<InspectorTab, ReactNode> = {
    artifacts: <ArtifactPanel detail={detail} artifacts={artifacts} canRestore={canRestore} onRestore={onRestore} onUseArtifact={onUseArtifact} onUpload={onUpload} />,
    evidence: <EvidencePanel selected={selected} detail={detail} />,
    memory: <MemoryPanel selected={selected} content={memoryContent} saving={savingMemory} onChange={onMemoryChange} onSave={onMemorySave} onClear={onMemoryClear} onRebuild={onMemoryRebuild} />,
    tools: <ToolInvocationList items={toolInvocations} />
  };

  return (
    <RadixTabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as InspectorTab)} className="workspace-inspector__tabs" aria-label="工作台 Inspector">
      <div className="workspace-inspector__header">
        <div>
          <p className="eyebrow">Inspector</p>
          <h2>运行详情</h2>
        </div>
        <Badge tone="neutral" className="tabular-nums">{artifacts.length + toolInvocations.length} items</Badge>
      </div>
      <div className="tabs-scroll">
        <RadixTabs.List className="workspace-inspector__tab-list" aria-label="工作台详情分类">
          {INSPECTOR_TABS.map((tab) => (
            <RadixTabs.Trigger key={tab.id} value={tab.id} className="workspace-inspector__tab">
              {tab.label}
            </RadixTabs.Trigger>
          ))}
        </RadixTabs.List>
      </div>
      {INSPECTOR_TABS.map(({ id: tab }) => (
        <RadixTabs.Content key={tab} value={tab} forceMount className="workspace-inspector__content" hidden={activeTab !== tab} data-inspector-tab={tab}>
          <TabsContentState state={contentState}>
            {renderInspectorContent(tab, contentState, error, panels[tab])}
          </TabsContentState>
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}

function getInspectorContentState({ selected, loading, error }: { selected: boolean; loading: boolean; error: string | null }): InspectorContentState {
  if (error) return "error";
  if (loading) return "loading";
  if (!selected) return "empty";
  return "default";
}

function renderInspectorContent(tab: InspectorTab, state: InspectorContentState, error: string | null, children: ReactNode) {
  if (state === "loading") {
    return <Skeleton variant="card" lines={3} label={`${EMPTY_COPY[tab].title}加载中`} />;
  }
  if (state === "error") {
    return <Alert tone="error" title={`${INSPECTOR_TABS.find((item) => item.id === tab)?.label ?? "详情"}加载失败`}>{error ?? "加载详情失败，请稍后重试。"}</Alert>;
  }
  if (state === "empty") {
    return <EmptyState title={EMPTY_COPY[tab].title} message={EMPTY_COPY[tab].message} />;
  }
  return children;
}
