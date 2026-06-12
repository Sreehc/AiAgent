import { FormEvent } from "react";
import { SearchHit } from "../../services/api";
import { Button, EmptyState, Field, Panel, Textarea } from "../../components/ui";

type SearchTestPanelProps = {
  selected: boolean;
  query: string;
  hits: SearchHit[];
  searching: boolean;
  onQueryChange: (query: string) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
};

export function SearchTestPanel({ selected, query, hits, searching, onQueryChange, onSearch }: SearchTestPanelProps) {
  return (
    <Panel title="检索测试" eyebrow="Search" action={<span className="badge">{hits.length} hits</span>}>
      <form className="search-test-layout" onSubmit={onSearch}>
        <Field label="检索问题"><Textarea value={query} onChange={(event) => onQueryChange(event.target.value)} rows={4} required /></Field>
        <Button type="submit" variant="primary" loading={searching} disabled={!selected}>开始检索</Button>
      </form>
      <div className="timeline search-hit-list">
        {hits.map((hit) => <article key={hit.chunkId} className="timeline-item"><div className="timeline-item__header"><strong>{hit.fileName}</strong><span className="badge badge--neutral">{hit.score.toFixed(4)}</span></div><p className="muted">chunk {hit.chunkNo} · {hit.documentId}</p><p>{hit.contentPreview}</p></article>)}
        {hits.length === 0 ? <EmptyState message="输入问题后可验证当前知识库的召回片段。" /> : null}
      </div>
    </Panel>
  );
}
