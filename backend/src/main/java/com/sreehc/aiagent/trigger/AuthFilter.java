package com.sreehc.aiagent.trigger;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.infrastructure.auth.SessionStore;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class AuthFilter extends OncePerRequestFilter {
    public static final String CURRENT_USER_ATTRIBUTE = "currentUser";
    public static final String ACCESS_TOKEN_ATTRIBUTE = "accessToken";

    private final SessionStore sessionStore;
    private final ObjectMapper objectMapper;

    public AuthFilter(SessionStore sessionStore, ObjectMapper objectMapper) {
        this.sessionStore = sessionStore;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (isPublicPath(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }
        String accessToken = extractAccessToken(request);
        if (accessToken == null) {
            writeUnauthorized(response, request);
            return;
        }
        Optional<SessionUser> sessionUser = sessionStore.find(accessToken);
        if (sessionUser.isEmpty()) {
            writeUnauthorized(response, request);
            return;
        }
        request.setAttribute(CURRENT_USER_ATTRIBUTE, sessionUser.get());
        request.setAttribute(ACCESS_TOKEN_ATTRIBUTE, accessToken);
        filterChain.doFilter(request, response);
    }

    private boolean isPublicPath(String requestUri) {
        return requestUri.startsWith("/api/v1/auth/login")
                || requestUri.startsWith("/api/v1/auth/register-by-invite")
                || requestUri.startsWith("/api/v1/auth/forgot-password")
                || requestUri.startsWith("/api/v1/health")
                || requestUri.startsWith("/actuator");
    }

    private String extractAccessToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        return header.substring(7);
    }

    private void writeUnauthorized(HttpServletResponse response, HttpServletRequest request) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), new ErrorResponse(
                "AUTH_INVALID",
                "Login required",
                String.valueOf(request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE))
        ));
    }
}

