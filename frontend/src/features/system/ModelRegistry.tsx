import { ModelConfigItem } from "../../services/api";
import { Badge, Button, EmptyState, Panel, StatusPill, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui";

type ModelRiskLevel = "default" | "warning" | "danger";

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
    <Panel title="模型注册表" eyebrow="Registry" description="按模型类型检查默认模型、provider、连接状态和最近测试结果。" action={<Badge>{models.filter((model) => model.enabled).length} active</Badge>}>
      <div className="stack">
        {groups.map((group) => (
          <section key={group.type} className="model-registry-group">
            <div className="model-registry-group__header">
              <strong>{group.type}</strong>
              <span>{group.items.length} models</span>
            </div>
            {group.items.length > 0 ? (
              <Table density="compact" minWidth="980px">
                <TableHeader>
                  <TableRow>
                    <TableHead>模型</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>连接</TableHead>
                    <TableHead status>状态</TableHead>
                    <TableHead>最近测试</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items.map((model) => (
                    <TableRow className="model-registry-row" data-risk={getModelRiskLevel(model)} key={model.id ?? `${model.modelType}-${model.modelCode}`}>
                      <TableCell>
                        <div className="model-registry-model">
                          <div>
                            <strong>{model.name}</strong>
                            {model.defaultModel ? <Badge tone="primary">默认</Badge> : null}
                          </div>
                          <code title={model.modelCode}>{model.modelCode}</code>
                        </div>
                      </TableCell>
	                      <TableCell>
	                        <div className="model-registry-provider">
	                          <Badge tone={model.riskLevel === "danger" ? "danger" : "neutral"}>{model.provider}</Badge>
	                          <small>{model.riskReasons[0] ?? model.modelType}</small>
	                        </div>
	                      </TableCell>
                      <TableCell>
                        <div className="model-registry-connection">
                          <code title={model.baseUrl}>{model.baseUrl}</code>
                          <small>API Key: {model.apiKeyMasked ?? "未设置"}</small>
                        </div>
                      </TableCell>
                      <TableCell status>
                        <StatusPill status={model.enabled ? "ACTIVE" : "INACTIVE"} />
                      </TableCell>
                      <TableCell>
                        <div className="model-registry-test">
                          <StatusPill status={model.lastTestStatus ?? "UNKNOWN"} />
                          <small>{model.lastTestedAt ? `测试于 ${formatDateTime(model.lastTestedAt)}` : "尚未测试"}</small>
                          {model.lastTestMessage ? <span title={model.lastTestMessage}>{model.lastTestMessage}</span> : null}
                        </div>
                      </TableCell>
                      <TableCell align="right">
                        <div className="model-registry-actions">
                          <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(model)}>编辑</Button>
                          <Button type="button" variant="secondary" size="sm" onClick={() => onToggle(model)}>{model.enabled ? "停用" : "启用"}</Button>
                          <Button type="button" variant="secondary" size="sm" disabled={model.defaultModel} onClick={() => onDefault(model)}>默认</Button>
                          <Button type="button" variant="secondary" size="sm" onClick={() => onTest(model)}>测试</Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(model)}>删除</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
            {!loading && group.items.length === 0 ? <p className="model-registry-empty">暂无 {group.type} 模型。</p> : null}
          </section>
        ))}
        {!loading && models.length === 0 ? <EmptyState title="没有模型配置" message="先录入一个聊天模型或嵌入模型。" /> : null}
      </div>
    </Panel>
  );
}

function getModelRiskLevel(model: ModelConfigItem): ModelRiskLevel {
  return model.riskLevel;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
