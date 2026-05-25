package com.vijaykumar.portfolio.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.ResponseErrorHandler;
import org.springframework.web.client.RestTemplate;
import java.io.IOException;
import java.time.Duration;

@Configuration
public class RestTemplateConfig {

    private final LoggingInterceptor loggingInterceptor;

    public RestTemplateConfig(LoggingInterceptor loggingInterceptor) {
        this.loggingInterceptor = loggingInterceptor;
    }

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        // Set timeouts using safe standard integer primitives
        factory.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        factory.setReadTimeout((int) Duration.ofSeconds(10).toMillis());

        RestTemplate restTemplate = new RestTemplate(factory);
        restTemplate.setErrorHandler(new CustomResponseErrorHandler());
        
        // Register the logging interceptor to capture HTTP interactions with email providers
        restTemplate.getInterceptors().add(loggingInterceptor);
        
        return restTemplate;
    }

    private static class CustomResponseErrorHandler implements ResponseErrorHandler {
        @Override
        public boolean hasError(ClientHttpResponse response) throws IOException {
            return response.getStatusCode().is4xxClientError() || response.getStatusCode().is5xxServerError();
        }

        @Override
        public void handleError(java.net.URI url, org.springframework.http.HttpMethod method, ClientHttpResponse response) throws IOException {
            // Allows HTTP error response payloads to flow transparently into downstream try-catch blocks
        }
    }
}