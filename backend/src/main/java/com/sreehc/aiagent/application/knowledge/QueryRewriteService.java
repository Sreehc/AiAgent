package com.sreehc.aiagent.application.knowledge;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class QueryRewriteService {
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern SPLIT_PATTERN = Pattern.compile("[,，;；。！？?!]|\\b(and|or|vs|versus|compare|between|with)\\b|以及|并且|或者|对比|比较");

    public RewritePlan rewrite(String query) {
        String normalized = normalize(query);
        if (normalized.isBlank()) {
            return new RewritePlan(normalized, List.of(), false);
        }

        boolean complex = isComplex(normalized);
        if (!complex) {
            return new RewritePlan(normalized, List.of(normalized), false);
        }

        LinkedHashSet<String> queries = new LinkedHashSet<>();
        queries.add(normalized);
        queries.add(extractFocusTerms(normalized));
        queries.addAll(splitClauses(normalized));
        queries.removeIf(String::isBlank);

        return new RewritePlan(normalized, new ArrayList<>(queries), true);
    }

    private String normalize(String query) {
        if (query == null) {
            return "";
        }
        return WHITESPACE.matcher(query.trim()).replaceAll(" ");
    }

    private boolean isComplex(String query) {
        if (query.length() >= 48) {
            return true;
        }
        String lower = query.toLowerCase(Locale.ROOT);
        return lower.contains(" and ")
                || lower.contains(" or ")
                || lower.contains(" vs ")
                || lower.contains(" compare ")
                || lower.contains(" between ")
                || query.contains("，")
                || query.contains("。")
                || query.contains("?")
                || query.contains("？")
                || query.contains("以及")
                || query.contains("对比")
                || query.contains("比较");
    }

    private String extractFocusTerms(String query) {
        String compact = query
                .replace("请帮我", "")
                .replace("请分析", "")
                .replace("请说明", "")
                .replace("帮我", "")
                .replace("一下", "")
                .replace("分别", "")
                .replace("一下子", "")
                .trim();
        return compact.isBlank() ? query : compact;
    }

    private List<String> splitClauses(String query) {
        List<String> clauses = new ArrayList<>();
        for (String part : SPLIT_PATTERN.split(query)) {
            String normalized = normalize(part);
            if (normalized.length() >= 6) {
                clauses.add(normalized);
            }
        }
        return clauses.stream().limit(3).toList();
    }

    public record RewritePlan(
            String normalizedQuery,
            List<String> queries,
            boolean complex
    ) {
    }
}
