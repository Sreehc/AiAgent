package com.sreehc.aiagent.application.knowledge;

import com.sreehc.aiagent.domain.knowledge.SearchHit;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ContextAssembler {
    private static final int DEFAULT_TOKEN_BUDGET = 900;

    public List<SearchHit> assemble(List<SearchHit> rerankedHits, int topK) {
        List<SearchHit> assembled = new ArrayList<>();
        int consumedTokens = 0;
        for (SearchHit hit : rerankedHits) {
            if (consumedTokens >= DEFAULT_TOKEN_BUDGET) {
                break;
            }
            if (!assembled.isEmpty()) {
                SearchHit previous = assembled.getLast();
                SearchHit merged = tryMerge(previous, hit, consumedTokens);
                if (merged != null) {
                    consumedTokens = consumedTokens - previous.tokenCount() + merged.tokenCount();
                    assembled.set(assembled.size() - 1, merged);
                    continue;
                }
            }
            if (consumedTokens + hit.tokenCount() > DEFAULT_TOKEN_BUDGET) {
                continue;
            }
            assembled.add(hit);
            consumedTokens += hit.tokenCount();
            if (assembled.size() >= Math.max(1, topK)) {
                break;
            }
        }
        return assembled;
    }

    private SearchHit tryMerge(SearchHit previous, SearchHit current, int consumedTokens) {
        if (!previous.documentId().equals(current.documentId())) {
            return null;
        }
        if (current.chunkNo() != previous.chunkNo() + 1) {
            return null;
        }
        int mergedTokens = previous.tokenCount() + current.tokenCount();
        if (consumedTokens - previous.tokenCount() + mergedTokens > DEFAULT_TOKEN_BUDGET) {
            return null;
        }
        String mergedPreview = previous.contentPreview() + "\n" + current.contentPreview();
        if (mergedPreview.length() > 500) {
            mergedPreview = mergedPreview.substring(0, 500);
        }
        String mergedText = previous.contentText() + "\n\n" + current.contentText();
        return new SearchHit(
                previous.kbId(),
                previous.documentId(),
                previous.fileName(),
                previous.chunkId() + "+" + current.chunkId(),
                previous.chunkNo(),
                mergedPreview,
                mergedText,
                previous.sectionTitle() != null ? previous.sectionTitle() : current.sectionTitle(),
                previous.headingPath() != null ? previous.headingPath() : current.headingPath(),
                mergedTokens,
                mergeStrategy(previous.retrievalStrategy(), current.retrievalStrategy()),
                Math.max(previous.score(), current.score())
        );
    }

    private String mergeStrategy(String left, String right) {
        if (left == null || left.isBlank()) {
            return right;
        }
        if (right == null || right.isBlank() || left.equals(right)) {
            return left;
        }
        if ("HYBRID".equals(left) || "HYBRID".equals(right)) {
            return "HYBRID";
        }
        return left + "+" + right;
    }
}
