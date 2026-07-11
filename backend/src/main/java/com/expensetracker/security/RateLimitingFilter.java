package com.expensetracker.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    // Simple Token-Bucket rate limiter per IP address
    private static final int MAX_BUCKET_CAPACITY = 100; // max requests
    private static final int REFILL_RATE_PER_MINUTE = 60; // refill amount
    private final Map<String, TokenBucket> ipBuckets = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String clientIp = getClientIp(request);
        TokenBucket bucket = ipBuckets.computeIfAbsent(clientIp, k -> new TokenBucket(MAX_BUCKET_CAPACITY, REFILL_RATE_PER_MINUTE));

        if (!bucket.tryConsume()) {
            log.warn("Rate limit exceeded for IP: {} on URL: {}", clientIp, request.getRequestURI());
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            Map<String, Object> errorDetails = new HashMap<>();
            errorDetails.put("timestamp", LocalDateTime.now().toString());
            errorDetails.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
            errorDetails.put("error", HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase());
            errorDetails.put("message", "Too many requests. Please try again in a minute.");
            errorDetails.put("path", request.getRequestURI());

            response.getWriter().write(objectMapper.writeValueAsString(errorDetails));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    private static class TokenBucket {
        private final long capacity;
        private final double refillRatePerMs;
        private double tokens;
        private long lastRefillTime;

        public TokenBucket(long capacity, long refillRatePerMinute) {
            this.capacity = capacity;
            this.refillRatePerMs = (double) refillRatePerMinute / (60.0 * 1000.0);
            this.tokens = capacity;
            this.lastRefillTime = System.currentTimeMillis();
        }

        public synchronized boolean tryConsume() {
            refill();
            if (tokens >= 1.0) {
                tokens -= 1.0;
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            long elapsedTime = now - lastRefillTime;
            if (elapsedTime > 0) {
                double tokensToAdd = elapsedTime * refillRatePerMs;
                tokens = Math.min(capacity, tokens + tokensToAdd);
                lastRefillTime = now;
            }
        }
    }
}
