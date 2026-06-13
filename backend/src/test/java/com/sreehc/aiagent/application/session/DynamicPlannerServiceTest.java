package com.sreehc.aiagent.application.session;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.app.AppProperties;
import com.sreehc.aiagent.domain.session.AgentMode;
import com.sreehc.aiagent.domain.session.StrategyMode;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DynamicPlannerServiceTest {

    @Test
    void shouldReplanFailedToolUntilConfiguredRoundLimit() {
        DynamicPlannerService service = new DynamicPlannerService(new ObjectMapper(), appProperties(3, 8));

        DynamicPlannerService.PlannerJudgement judgement = service.parseOrFallbackJudgement(
                "",
                1,
                3,
                2,
                true,
                "tool failed"
        );

        assertEquals(DynamicPlannerService.PlannerAction.REPLAN, judgement.action());
        assertEquals(1, judgement.steps().size());
    }

    @Test
    void shouldStopReplanningAfterConfiguredRoundLimit() {
        DynamicPlannerService service = new DynamicPlannerService(new ObjectMapper(), appProperties(2, 8));

        DynamicPlannerService.PlannerJudgement judgement = service.parseOrFallbackJudgement(
                "",
                1,
                3,
                2,
                true,
                "tool failed"
        );

        assertEquals(DynamicPlannerService.PlannerAction.CONTINUE, judgement.action());
    }

    @Test
    void shouldTrimReplanStepsToConfiguredMaxPlanSteps() {
        DynamicPlannerService service = new DynamicPlannerService(new ObjectMapper(), appProperties(3, 4));
        List<DynamicPlannerService.PlanDraft> current = List.of(
                draft(1),
                draft(2),
                draft(3)
        );
        List<DynamicPlannerService.PlanDraft> proposed = List.of(
                new DynamicPlannerService.PlanDraft(1, "补充 A", "tool-a", "a", "a"),
                new DynamicPlannerService.PlanDraft(2, "补充 B", "tool-b", "b", "b")
        );

        List<DynamicPlannerService.PlanDraft> trimmed = service.trimReplanSteps(current, proposed);

        assertEquals(1, trimmed.size());
        assertEquals(4, trimmed.getFirst().stepNo());
        assertEquals("补充 A", trimmed.getFirst().title());
    }

    @Test
    void shouldParseModelPlanWhenValidJsonIsReturned() {
        DynamicPlannerService service = new DynamicPlannerService(new ObjectMapper(), appProperties(3, 8));
        String planJson = """
                [
                  {"title":"检索资料","toolName":"knowledge-search","toolInput":"q","toolOutput":"evidence"},
                  {"title":"生成报告","toolName":"report-writer","toolInput":"report","toolOutput":"done"}
                ]
                """;

        List<DynamicPlannerService.PlanDraft> plan = service.parseOrFallbackPlan(
                planJson,
                new SessionService.CreateRunCommand("研究问题", AgentMode.PLAN_EXECUTE, List.of(), StrategyMode.AUTO, List.of()),
                List.of(),
                ""
        );

        assertEquals(2, plan.size());
        assertEquals("检索资料", plan.getFirst().title());
    }

    private DynamicPlannerService.PlanDraft draft(int stepNo) {
        return new DynamicPlannerService.PlanDraft(stepNo, "step " + stepNo, "tool", "input", "output");
    }

    private static AppProperties appProperties(int maxPlanningRounds, int maxPlanSteps) {
        return new AppProperties(
                new AppProperties.Auth(7200L, 5, 600L),
                new AppProperties.Storage("http://localhost:9000", "minioadmin", "minioadmin", "aiagent", 900L),
                new AppProperties.Embedding("local-mock", "text-embedding-3-small", "https://api.openai.com/v1", "", 1536, 5000L, 15000L),
                new AppProperties.Kafka("localhost:9092", "aiagent.knowledge.index", "aiagent-backend"),
                new AppProperties.Rag(3600L, 300L, 1500L),
                new AppProperties.Chat("local-mock", "claude-sonnet-4-6", "", ""),
                new AppProperties.Image("local-mock", "image-generation-default", "", ""),
                new AppProperties.Mcp("localhost", false, ""),
                new AppProperties.Email("log", "no-reply@aiagent.local", "http://localhost:5173/reset-password", "localhost", 1025, null, null, false, false, 5000L, 10000L),
                new AppProperties.Run(maxPlanningRounds, maxPlanSteps, 10L),
                new AppProperties.Bootstrap(true),
                new AppProperties.Secret("")
        );
    }
}
