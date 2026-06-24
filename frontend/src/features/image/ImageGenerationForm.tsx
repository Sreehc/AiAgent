import { FormEvent } from "react";
import { SessionItem } from "../../services/api";
import { Alert, Button, Field, FileInput, Panel, Select, Tabs, Textarea } from "../../components/ui";

export type ImageMode = "IMAGES" | "EDITS";
export type ImageFormState = { mode: ImageMode; prompt: string; size: string; sessionId: string };

type ImageGenerationFormProps = {
  form: ImageFormState;
  sessions: SessionItem[];
  referenceFile: File | null;
  submitting: boolean;
  onFormChange: (form: ImageFormState) => void;
  onReferenceFileChange: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ImageGenerationForm({ form, sessions, referenceFile, submitting, onFormChange, onReferenceFileChange, onSubmit }: ImageGenerationFormProps) {
  const selectedSession = sessions.find((item) => item.sessionId === form.sessionId) ?? null;
  return (
    <Panel title="生成参数" eyebrow="Controls" className="image-controls-panel">
      <form className="image-generation-form" onSubmit={onSubmit}>
        <div className="image-generation-form__mode">
          <Tabs ariaLabel="图片生成模式" value={form.mode} items={[{ id: "IMAGES", label: "文本生图" }, { id: "EDITS", label: "参考图编辑" }]} onChange={(mode) => onFormChange({ ...form, mode })} />
        </div>
        <Field label="Prompt"><Textarea rows={7} value={form.prompt} onChange={(event) => onFormChange({ ...form, prompt: event.target.value })} required /></Field>
        <div className="form-row">
          <Field label="尺寸"><Select value={form.size} onChange={(event) => onFormChange({ ...form, size: event.target.value })}><option value="1024x1024">1024x1024</option><option value="1536x1024">1536x1024</option><option value="1024x1536">1024x1536</option></Select></Field>
          <Field label="挂接会话"><Select value={form.sessionId} onChange={(event) => onFormChange({ ...form, sessionId: event.target.value })}><option value="">不挂接会话</option>{sessions.map((item) => <option key={item.sessionId} value={item.sessionId}>{item.title}</option>)}</Select></Field>
        </div>
        {form.mode === "EDITS" ? <Field label="参考图" description="上传一张需要编辑的参考图片。"><FileInput accept="image/*" fileName={referenceFile?.name ?? null} disabled={submitting} clearKey={referenceFile?.name ?? null} onChange={(event) => onReferenceFileChange(event.target.files?.[0] ?? null)} required /></Field> : null}
        {selectedSession ? <Alert tone="info">结果会同步到会话「{selectedSession.title}」的产物区。</Alert> : null}
        <div className="image-generation-form__action">
          <Button type="submit" variant="primary" loading={submitting} fullWidth>{form.mode === "IMAGES" ? "生成图片" : "开始编辑"}</Button>
        </div>
      </form>
    </Panel>
  );
}
