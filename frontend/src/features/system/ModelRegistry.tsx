import { ModelConfigItem } from "../../services/api";
import { Badge, Button, EmptyState, Panel, StatusPill, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui";

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
    <Panel title="模型注册表" eyebrow="Registry" action={<Badge>{models.filter((model) => model.enabled).length} active</Badge>}>
      <div className="stack">
        {groups.map((group) => (
          <section key={group.type} className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground">
              <strong>{group.type}</strong>
              <span className="text-xs font-normal text-muted-foreground">{group.items.length} models</span>
            </div>
            {group.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>模型</TableHead>
                    <TableHead>连接</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items.map((model) => (
                    <TableRow key={model.id ?? `${model.modelType}-${model.modelCode}`}>
                      <TableCell>
                        <strong>{model.name}</strong>
                        <div className="text-xs text-muted-foreground">{model.modelCode} · {model.provider}{model.defaultModel ? " · 默认" : ""}</div>
                        {model.lastTestMessage ? <p className="text-xs text-muted-foreground">{model.lastTestStatus}: {model.lastTestMessage}</p> : null}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{model.baseUrl}</code>
                        <div className="text-xs text-muted-foreground">API Key: {model.apiKeyMasked ?? "未设置"}</div>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={model.enabled ? "ACTIVE" : "INACTIVE"} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(model)}>编辑</Button>
                          <Button type="button" variant="secondary" size="sm" onClick={() => onToggle(model)}>{model.enabled ? "停用" : "启用"}</Button>
                          <Button type="button" variant="secondary" size="sm" onClick={() => onDefault(model)}>默认</Button>
                          <Button type="button" variant="secondary" size="sm" onClick={() => onTest(model)}>测试</Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(model)}>删除</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
            {!loading && group.items.length === 0 ? <p className="text-sm text-muted-foreground">暂无 {group.type} 模型。</p> : null}
          </section>
        ))}
        {!loading && models.length === 0 ? <EmptyState title="没有模型配置" message="先录入一个聊天模型或嵌入模型。" /> : null}
      </div>
    </Panel>
  );
}
