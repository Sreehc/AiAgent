import { ModelConfigItem } from "../../services/api";
import { Button, EmptyState, Panel, StatusPill } from "../../components/ui";

type ModelRegistryProps = {
  models: ModelConfigItem[];
  loading: boolean;
  onToggle: (model: ModelConfigItem) => void;
  onEdit: (model: ModelConfigItem) => void;
  onDelete: (model: ModelConfigItem) => void;
  onTest: (model: ModelConfigItem) => void;
  onDefault: (model: ModelConfigItem) => void;
};

export function ModelRegistry({ models, loading, onToggle, onEdit, onDelete, onTest, onDefault }: ModelRegistryProps) {
  const groups = (["CHAT", "EMBEDDING", "IMAGE"] as const).map((type) => ({ type, items: models.filter((model) => model.modelType === type) }));
  return (
    <Panel title="模型注册表" eyebrow="Registry" action={<span className="badge">{models.filter((model) => model.enabled).length} active</span>}>
      <div className="stack">
        {groups.map((group) => (
          <section key={group.type} className="registry-group">
            <div className="registry-group__header"><strong>{group.type}</strong><span>{group.items.length} models</span></div>
            <div className="table-list">
              {group.items.map((model) => <article key={model.id ?? `${model.modelType}-${model.modelCode}`} className="table-row"><div><strong>{model.name}</strong><br /><small>{model.modelCode} · {model.provider}{model.defaultModel ? " · 默认" : ""}</small>{model.lastTestMessage ? <p className="muted">{model.lastTestStatus}: {model.lastTestMessage}</p> : null}</div><div><code>{model.baseUrl}</code><br /><small>API Key: {model.apiKeyMasked ?? "未设置"}</small></div><StatusPill status={model.enabled ? "ACTIVE" : "INACTIVE"} /><div className="cluster"><Button type="button" variant="secondary" size="sm" onClick={() => onEdit(model)}>编辑</Button><Button type="button" variant="secondary" size="sm" onClick={() => onToggle(model)}>{model.enabled ? "停用" : "启用"}</Button><Button type="button" variant="secondary" size="sm" onClick={() => onDefault(model)}>默认</Button><Button type="button" variant="secondary" size="sm" onClick={() => onTest(model)}>测试</Button><Button type="button" variant="ghost" size="sm" onClick={() => onDelete(model)}>删除</Button></div></article>)}
              {!loading && group.items.length === 0 ? <p className="muted registry-group__empty">暂无 {group.type} 模型。</p> : null}
            </div>
          </section>
        ))}
        {!loading && models.length === 0 ? <EmptyState title="没有模型配置" message="先录入一个聊天模型或嵌入模型。" /> : null}
      </div>
    </Panel>
  );
}
