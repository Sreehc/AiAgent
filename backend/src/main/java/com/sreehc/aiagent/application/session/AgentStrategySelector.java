package com.sreehc.aiagent.application.session;

import com.sreehc.aiagent.domain.session.AgentMode;
import com.sreehc.aiagent.domain.session.StrategyMode;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class AgentStrategySelector {
    public Decision select(String query, AgentMode requestedMode, StrategyMode strategyMode, List<String> knowledgeBaseIds, List<String> artifactIds) {
        if (strategyMode == StrategyMode.MANUAL && requestedMode != null) {
            return new Decision(requestedMode, "USER_SELECTED", "用户手动选择执行模式", 1.0);
        }
        String normalized = query == null ? "" : query.toLowerCase(Locale.ROOT);
        int complexity = 0;
        if (normalized.length() > 80) {
            complexity++;
        }
        for (String marker : List.of("对比", "比较", "竞品", "竞争", "趋势", "规划", "拆解", "评估", "分析", "方案", "market", "compare", "strategy")) {
            if (normalized.contains(marker)) {
                complexity++;
            }
        }
        if (knowledgeBaseIds != null && knowledgeBaseIds.size() > 1) {
            complexity++;
        }
        if (artifactIds != null && !artifactIds.isEmpty()) {
            complexity++;
        }
        AgentMode selected = complexity >= 2 ? AgentMode.PLAN_EXECUTE : AgentMode.REACT;
        String reason = selected == AgentMode.PLAN_EXECUTE
                ? "任务包含多对象或复杂分析信号，适合先规划再执行"
                : "任务较短或目标单一，适合 ReAct 快速执行";
        return new Decision(selected, "AUTO_SELECTED", reason, Math.min(0.95, 0.6 + complexity * 0.1));
    }

    public record Decision(
            AgentMode executionMode,
            String source,
            String reason,
            double confidence
    ) {
    }
}
