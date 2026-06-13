package com.sreehc.aiagent.application.session;

import com.sreehc.aiagent.infrastructure.session.SessionRepository;
import com.sreehc.aiagent.app.AppProperties;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RunRecoveryScheduler {
    private final SessionRepository sessionRepository;
    private final AppProperties appProperties;

    public RunRecoveryScheduler(SessionRepository sessionRepository, AppProperties appProperties) {
        this.sessionRepository = sessionRepository;
        this.appProperties = appProperties;
    }

    @Scheduled(fixedDelayString = "${app.run-recovery.scan-interval-millis:60000}")
    public void markStaleRunsTimedOut() {
        sessionRepository.markStaleRunsTimedOut(Instant.now().minus(staleTimeoutMinutes(), ChronoUnit.MINUTES));
    }

    private long staleTimeoutMinutes() {
        Long configured = appProperties.run() == null ? null : appProperties.run().staleTimeoutMinutes();
        return configured == null || configured < 1 ? 10L : configured;
    }
}
