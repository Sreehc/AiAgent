package com.sreehc.aiagent.application.session;

import com.sreehc.aiagent.domain.session.AgentMode;
import com.sreehc.aiagent.domain.session.StrategyMode;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AgentStrategySelectorTest {
    private final AgentStrategySelector selector = new AgentStrategySelector();

    @Test
    void shouldSelectPlanExecuteForComplexAutoTask() {
        AgentStrategySelector.Decision decision = selector.select(
                "请对比三个竞品的市场趋势、能力差异和后续策略方案",
                AgentMode.REACT,
                StrategyMode.AUTO,
                List.of("kb_1", "kb_2"),
                List.of("art_1")
        );

        assertEquals(AgentMode.PLAN_EXECUTE, decision.executionMode());
        assertEquals("AUTO_SELECTED", decision.source());
        assertTrue(decision.reason().contains("复杂分析"));
    }

    @Test
    void shouldPreferManualUserSelection() {
        AgentStrategySelector.Decision decision = selector.select(
                "复杂竞品分析",
                AgentMode.REACT,
                StrategyMode.MANUAL,
                List.of("kb_1", "kb_2"),
                List.of("art_1")
        );

        assertEquals(AgentMode.REACT, decision.executionMode());
        assertEquals("USER_SELECTED", decision.source());
        assertEquals(1.0, decision.confidence());
    }
}
