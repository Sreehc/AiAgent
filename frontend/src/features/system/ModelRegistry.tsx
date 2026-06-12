import { ModelConfigItem } from "../../services/api";
import { EmptyState, Panel, StatusPill } from "../../components/ui";

export function ModelRegistry({ models, loading }: { models: ModelConfigItem[]; loading: boolean }) {
  const groups = (["CHAT", "EMBEDDING", "IMAGE"] as const).map((type) => ({ type, items: models.filter((model) => model.modelType === type) }));
  return (
    <Panel title="模型注册表" eyebrow="Registry" action={<span className="badge">{models.filter((model) => model.enabled).length} active</span>}>
      <div className="stack">
        {groups.map((group) => (
          <section key={group.type} className="registry-group">
            <div className="registry-group__header"><strong>{group.type}</strong><span>{group.items.length} models</span></div>
            <div className="table-list">
              {group.items.map((model) => <article key={model.id ?? `${model.modelType}-${model.modelCode}`} className="table-row"><div><strong>{model.name}</strong><br /><small>{model.modelCode} · {model.provider}</small></div><div><code>{model.baseUrl}</code><br /><small>API Key: {model.apiKeyMasked ?? "未设置"}</small></div><StatusPill status={model.enabled ? "ACTIVE" : "INACTIVE"} /></article>)}
              {!loading && group.items.length === 0 ? <p className="muted registry-group__empty">暂无 {group.type} 模型。</p> : null}
            </div>
          </section>
        ))}
        {!loading && models.length === 0 ? <EmptyState title="没有模型配置" message="先录入一个聊天模型或嵌入模型。" /> : null}
      </div>
    </Panel>
  );
}
