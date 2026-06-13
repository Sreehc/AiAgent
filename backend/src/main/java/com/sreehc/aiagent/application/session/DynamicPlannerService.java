package com.sreehc.aiagent.application.session;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.app.AppProperties;
import com.sreehc.aiagent.domain.knowledge.SearchHit;
import com.sreehc.aiagent.domain.session.AgentMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DynamicPlannerService {
    private final ObjectMapper objectMapper;
    private final AppProperties appProperties;

    public DynamicPlannerService(ObjectMapper objectMapper, AppProperties appProperties) {
        this.objectMapper = objectMapper;
        this.appProperties = appProperties;
    }

    public List<PlanDraft> parseOrFallbackPlan(String plannerJson, SessionService.CreateRunCommand command, List<SearchHit> evidenceHits, String memoryPrompt) {
        List<PlanDraft> modelPlan = parsePlannerJson(plannerJson);
        if (!modelPlan.isEmpty()) {
            return modelPlan;
        }
        String evidenceSummary = evidenceHits.isEmpty()
                ? "当前未绑定知识库，使用普通公开执行链路"
                : "检索到 " + evidenceHits.size() + " 条知识库证据，可注入执行上下文";
        List<PlanDraft> dynamicPlan = new ArrayList<>();
        dynamicPlan.add(new PlanDraft(1, "理解研究问题并确定范围", "query-analyzer", command.query(), emptyToFallback(plannerJson, "根据任务生成研究范围")));
        if (!command.knowledgeBaseIds().isEmpty() || !evidenceHits.isEmpty()) {
            dynamicPlan.add(new PlanDraft(dynamicPlan.size() + 1, "注入知识库证据与上下文", "knowledge-search", "knowledgeBaseIds=" + command.knowledgeBaseIds(), evidenceSummary));
        }
        if (memoryPrompt != null && !memoryPrompt.isBlank()) {
            dynamicPlan.add(new PlanDraft(dynamicPlan.size() + 1, "合并会话记忆与复用产物", "memory-reader", "artifactIds=" + command.artifactIds(), "已读取会话摘要、最近消息和复用产物"));
        }
        if (command.executionMode() == AgentMode.PLAN_EXECUTE) {
            dynamicPlan.add(new PlanDraft(dynamicPlan.size() + 1, "拆解主要对象与关键变量", "competitor-analyzer", "compare=players", "分析主要对象、差异化能力和风险"));
        }
        dynamicPlan.add(new PlanDraft(dynamicPlan.size() + 1, "归纳结论并生成交付报告", "report-writer", "output=structured-report", "输出结论摘要、风险、建议与后续观察点"));
        return dynamicPlan;
    }

    public PlannerJudgement parseOrFallbackJudgement(
            String judgementJson,
            int currentStepNo,
            int totalSteps,
            int planningRounds,
            boolean toolFailed,
            String observation
    ) {
        PlannerJudgement modelJudgement = parseJudgementJson(judgementJson);
        if (modelJudgement != null) {
            return modelJudgement;
        }
        if (toolFailed && planningRounds < maxPlanningRounds()) {
            return new PlannerJudgement(
                    PlannerAction.REPLAN,
                    "工具调用失败，需要补救步骤",
                    List.of(new PlanDraft(totalSteps + 1, "补救失败工具并回到内置执行链路", "fallback-reasoner", "failedStep=" + currentStepNo, "工具失败后使用已有上下文、检索证据和模型能力继续完成任务"))
            );
        }
        if (currentStepNo >= totalSteps || containsCompletionSignal(observation)) {
            return new PlannerJudgement(PlannerAction.DONE, "已完成计划中的关键步骤", List.of());
        }
        return new PlannerJudgement(PlannerAction.CONTINUE, "继续执行下一步骤", List.of());
    }

    public List<PlanDraft> trimReplanSteps(List<PlanDraft> currentPlan, List<PlanDraft> proposedSteps) {
        int maxPlanSteps = maxPlanSteps();
        if (proposedSteps == null || proposedSteps.isEmpty() || currentPlan.size() >= maxPlanSteps) {
            return List.of();
        }
        int nextStepNo = currentPlan.size() + 1;
        List<PlanDraft> trimmed = new ArrayList<>();
        int maxAdditionalSteps = maxPlanSteps - currentPlan.size();
        for (int index = 0; index < proposedSteps.size() && index < maxAdditionalSteps; index++) {
            PlanDraft step = proposedSteps.get(index);
            trimmed.add(new PlanDraft(nextStepNo + index, step.title(), step.toolName(), step.toolInput(), step.toolOutput()));
        }
        return trimmed;
    }

    private List<PlanDraft> parsePlannerJson(String plannerJson) {
        if (plannerJson == null || plannerJson.isBlank() || !plannerJson.stripLeading().startsWith("[")) {
            return List.of();
        }
        try {
            List<?> rawSteps = objectMapper.readValue(plannerJson, List.class);
            List<PlanDraft> steps = new ArrayList<>();
            int index = 1;
            for (Object rawStep : rawSteps) {
                if (rawStep instanceof Map<?, ?> map) {
                    String title = stringValue(map.get("title"));
                    String toolName = stringValue(map.get("toolName"));
                    if (title.isBlank() || toolName.isBlank()) {
                        continue;
                    }
                    steps.add(new PlanDraft(
                            index++,
                            title,
                            toolName,
                            stringValue(map.get("toolInput")),
                            stringValue(map.get("toolOutput"))
                    ));
                }
            }
            return steps;
        } catch (Exception exception) {
            return List.of();
        }
    }

    private PlannerJudgement parseJudgementJson(String judgementJson) {
        if (judgementJson == null || judgementJson.isBlank() || !judgementJson.stripLeading().startsWith("{")) {
            return null;
        }
        try {
            Map<?, ?> map = objectMapper.readValue(judgementJson, Map.class);
            PlannerAction action = PlannerAction.valueOf(stringValue(map.get("action")).toUpperCase());
            String reason = stringValue(map.get("reason"));
            List<PlanDraft> steps = new ArrayList<>();
            Object rawSteps = map.get("steps");
            if (rawSteps instanceof List<?> list) {
                int index = 1;
                for (Object rawStep : list) {
                    if (rawStep instanceof Map<?, ?> stepMap) {
                        String title = stringValue(stepMap.get("title"));
                        String toolName = stringValue(stepMap.get("toolName"));
                        if (!title.isBlank() && !toolName.isBlank()) {
                            steps.add(new PlanDraft(index++, title, toolName, stringValue(stepMap.get("toolInput")), stringValue(stepMap.get("toolOutput"))));
                        }
                    }
                }
            }
            return new PlannerJudgement(action, reason.isBlank() ? action.name() : reason, steps);
        } catch (Exception exception) {
            return null;
        }
    }

    private boolean containsCompletionSignal(String observation) {
        if (observation == null) {
            return false;
        }
        String normalized = observation.toLowerCase();
        return normalized.contains("完成") || normalized.contains("done") || normalized.contains("report") || normalized.contains("结论");
    }

    private String emptyToFallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    public int maxPlanningRounds() {
        Integer configured = appProperties.run() == null ? null : appProperties.run().maxPlanningRounds();
        return configured == null || configured < 1 ? 3 : configured;
    }

    public int maxPlanSteps() {
        Integer configured = appProperties.run() == null ? null : appProperties.run().maxPlanSteps();
        return configured == null || configured < 1 ? 8 : configured;
    }

    public enum PlannerAction {
        CONTINUE,
        REPLAN,
        DONE
    }

    public record PlanDraft(
            int stepNo,
            String title,
            String toolName,
            String toolInput,
            String toolOutput
    ) {
    }

    public record PlannerJudgement(
            PlannerAction action,
            String reason,
            List<PlanDraft> steps
    ) {
    }
}
