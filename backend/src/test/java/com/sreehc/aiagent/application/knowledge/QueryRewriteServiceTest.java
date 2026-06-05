package com.sreehc.aiagent.application.knowledge;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class QueryRewriteServiceTest {
    private final QueryRewriteService service = new QueryRewriteService();

    @Test
    void shouldKeepSimpleQueryAsSinglePath() {
        QueryRewriteService.RewritePlan plan = service.rewrite("OpenAI pricing");

        assertFalse(plan.complex());
        assertEquals(1, plan.queries().size());
        assertEquals("OpenAI pricing", plan.normalizedQuery());
    }

    @Test
    void shouldExpandComplexChineseQuery() {
        QueryRewriteService.RewritePlan plan = service.rewrite("请帮我对比 OpenAI 和 Anthropic 的定价、上下文窗口以及企业能力差异");

        assertTrue(plan.complex());
        assertTrue(plan.queries().size() >= 2);
        assertEquals("请帮我对比 OpenAI 和 Anthropic 的定价、上下文窗口以及企业能力差异", plan.normalizedQuery());
        assertTrue(plan.queries().stream().anyMatch(query -> query.contains("OpenAI")));
    }

    @Test
    void shouldNormalizeWhitespace() {
        QueryRewriteService.RewritePlan plan = service.rewrite("  compare   model pricing   and latency  ");

        assertEquals("compare model pricing and latency", plan.normalizedQuery());
        assertTrue(plan.complex());
    }
}
