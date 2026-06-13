package com.sreehc.aiagent.application.session;

import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.session.AgentSession;
import com.sreehc.aiagent.domain.session.ExecutionRun;
import com.sreehc.aiagent.infrastructure.session.SessionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RunControlService {
    private final SessionRepository sessionRepository;

    public RunControlService(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    public ExecutionRun cancel(SessionUser currentUser, AgentSession session, String runCode, String reason) {
        boolean requested = sessionRepository.requestRunCancel(currentUser.id(), session.sessionCode(), runCode, blankToDefault(reason, "Cancelled by user"));
        if (!requested) {
            throw new AppException("RUN_NOT_CANCELABLE", "Run is not running or cannot be cancelled", HttpStatus.CONFLICT);
        }
        return sessionRepository.findRunByCode(session.id(), runCode)
                .orElseThrow(() -> new AppException("RUN_NOT_FOUND", "Run not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public ExecutionRun pause(SessionUser currentUser, AgentSession session, String runCode, String reason) {
        boolean paused = sessionRepository.pauseRun(currentUser.id(), session.sessionCode(), runCode, blankToDefault(reason, "Paused by user"));
        if (!paused) {
            throw new AppException("RUN_NOT_PAUSABLE", "Run is not running or cannot be paused", HttpStatus.CONFLICT);
        }
        return sessionRepository.findRunByCode(session.id(), runCode)
                .orElseThrow(() -> new AppException("RUN_NOT_FOUND", "Run not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public ExecutionRun resume(SessionUser currentUser, AgentSession session, String runCode) {
        boolean resumed = sessionRepository.resumeRun(currentUser.id(), session.sessionCode(), runCode);
        if (!resumed) {
            throw new AppException("RUN_NOT_RESUMABLE", "Run is not paused or cannot be resumed", HttpStatus.CONFLICT);
        }
        return sessionRepository.findRunByCode(session.id(), runCode)
                .orElseThrow(() -> new AppException("RUN_NOT_FOUND", "Run not found", HttpStatus.NOT_FOUND));
    }

    private String blankToDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value;
    }
}
