package com.sreehc.aiagent.application.knowledge;

import com.sreehc.aiagent.domain.knowledge.SearchHit;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HybridSearchResultMergerTest {

    private final HybridSearchResultMerger merger = new HybridSearchResultMerger();

    @Test
    void shouldPreferChunksReturnedByBothRetrievers() {
        SearchHit shared = hit("chunk-shared", 0.82, "Overview", "Overview");
        SearchHit vectorOnly = hit("chunk-vector", 0.91, null, null);
        SearchHit keywordOnly = hit("chunk-keyword", 0.27, "Glossary", "Glossary");

        List<SearchHit> merged = merger.merge(
                List.of(shared, vectorOnly),
                List.of(keywordOnly, shared),
                3
        );

        assertEquals("chunk-shared", merged.getFirst().chunkId());
        assertEquals("Overview", merged.getFirst().sectionTitle());
        assertEquals(3, merged.size());
    }

    @Test
    void shouldLimitResultSize() {
        List<SearchHit> merged = merger.merge(
                List.of(hit("chunk-1", 0.6, null, null), hit("chunk-2", 0.5, null, null)),
                List.of(hit("chunk-3", 0.4, null, null)),
                2
        );

        assertEquals(2, merged.size());
    }

    private SearchHit hit(String chunkId, double score, String sectionTitle, String headingPath) {
        return new SearchHit(
                "kb_1",
                "doc_1",
                "guide.md",
                chunkId,
                1,
                "preview",
                sectionTitle,
                headingPath,
                score
        );
    }
}
