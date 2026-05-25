package com.vijaykumar.portfolio.config;

import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

/**
 * HTTP Logging Interceptor — Production Safe
 * 
 * Logs outgoing HTTP requests and responses for debugging email providers.
 * API keys and sensitive data are REDACTED from logs.
 * 
 * PERFORMANCE: Minimal overhead — only logs on DEBUG level.
 * If root logger is INFO/WARN, this interceptor does minimal work.
 */
@Component
class LoggingInterceptor implements ClientHttpRequestInterceptor {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(LoggingInterceptor.class);
    
    // Headers that should NEVER appear in logs
    private static final String[] SENSITIVE_HEADERS = {
        "api-key", "Authorization", "X-Requested-With", "Cookie"
    };

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, 
                                         ClientHttpRequestExecution execution) throws IOException {
        
        // Only do expensive logging if DEBUG is enabled
        if (log.isDebugEnabled()) {
            logRequest(request, body);
        }
        
        ClientHttpResponse response = execution.execute(request, body);
        
        if (log.isDebugEnabled()) {
            logResponse(response);
        }
        
        return response;
    }

    private void logRequest(HttpRequest request, byte[] body) {
        String method = request.getMethod().name();
        String uri = request.getURI().toString();
        // Mask any API keys that might appear in URI (shouldn't happen, but safety first)
        String safeUri = uri.replaceAll("key=[^&]*", "key=***REDACTED***");
        
        log.debug("→ HTTP {} {}", method, safeUri);
        
        // Log body length but not content (may contain PII)
        if (body.length > 0) {
            log.debug("→ Request body: {} bytes", body.length);
        }
    }

    private void logResponse(ClientHttpResponse response) throws IOException {
        int statusCode = response.getStatusCode().value();
        String statusText = response.getStatusText();
        
        // Log status at appropriate level based on severity
        if (statusCode >= 500) {
            log.debug("← HTTP {} {} (SERVER ERROR)", statusCode, statusText);
        } else if (statusCode >= 400) {
            log.debug("← HTTP {} {} (CLIENT ERROR)", statusCode, statusText);
        } else {
            log.debug("← HTTP {} {}", statusCode, statusText);
        }
    }
}
