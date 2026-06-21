import { FormEvent } from "react";
import { SearchHit } from "../../services/api";
import { Badge, Button, EmptyState, Field, Panel, Skeleton, Textarea } from "../../components/ui";

type SearchTestPanelProps = {
  selected: boolean;
  query: string;
  hits: SearchHit[];
  searching: boolean;
  hasSearched: boolean;
  onQueryChange: (query: string) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
};

export function SearchTestPanel({ selected, query, hits, searching, hasSearched, onQueryChange, onSearch }: SearchTestPanelProps) {
  return (
    <Panel title="检索测试" eyebrow="Search" className="rag-search-panel" state={searching ? "loading" : "default"} action={<Badge className="tabular-nums">{hits.length} hits</Badge>}>
      <form className="search-test-layout" onSubmit={onSearch}>
        <Field label="检索问题"><Textarea value={query} onChange={(event) => onQueryChange(event.target.value)} rows={4} required disabled={!selected} /></Field>
        <Button type="submit" variant="primary" loading={searching} disabled={!selected || searching}>开始检索</Button>
      </form>
      <div className="rag-search-results" aria-label="检索命中结果">
        {searching ? <Skeleton variant="list" lines={4} label="正在检索命中片段" /> : null}
        {hits.map((hit) => <SearchEvidenceCard key={hit.chunkId} hit={hit} />)}
        {!searching && hasSearched && hits.length === 0 ? <EmptyState title="没有命中" message="可以调整 Query、补充文档或重新索引后再测试。" /> : null}
        {!searching && !hasSearched ? <EmptyState message={selected ? "输入问题后可验证当前知识库的召回片段。" : "先选择知识库，再执行检索测试。"} /> : null}
      </div>
    </Panel>
  );
}

function SearchEvidenceCard({ hit }: { hit: SearchHit }) {
  return (
    <article className="search-hit-card" aria-label={`检索命中 #${hit.rank}`} data-rank={hit.rank}>
      <div className="search-hit-card__topline">
        <div className="search-hit-card__rank">
          <span>Rank</span>
          <strong className="tabular-nums">#{hit.rank}</strong>
        </div>
        <div className="search-hit-card__source">
          <span>文件名</span>
          <strong title={hit.fileName}>{hit.fileName}</strong>
        </div>
        <div className="search-hit-card__score">
          <span>Score</span>
          <Badge tone="neutral" className="tabular-nums">{hit.score.toFixed(4)}</Badge>
        </div>
      </div>

      <div className="search-hit-card__metrics">
        <div className="search-hit-card__field">
          <span>Citation</span>
          <strong className="id-text truncate-id" title={hit.citationId}>{hit.citationId}</strong>
        </div>
        <div className="search-hit-card__field">
          <span>Section</span>
          <strong title={hit.sectionTitle ?? "未标注"}>{hit.sectionTitle ?? "未标注"}</strong>
        </div>
        <div className="search-hit-card__field">
          <span>Chunk</span>
          <strong className="numeric">chunk {hit.chunkNo}</strong>
        </div>
        <div className="search-hit-card__field">
          <span>策略</span>
          <strong>{hit.retrievalStrategy}</strong>
        </div>
      </div>

      <p className="search-hit-card__location">
        <span className="numeric">offset {hit.sourceOffset}</span>
        <span aria-hidden="true">/</span>
        {hit.headingPath ? <span>{hit.headingPath}</span> : <span className="id-text truncate-id" title={hit.documentId}>{hit.documentId}</span>}
      </p>
      <p className="search-hit-card__preview">{hit.contentPreview}</p>
    </article>
  );
}
