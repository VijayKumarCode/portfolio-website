package com.vijaykumar.portfolio.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.util.concurrent.Executor;
import java.util.concurrent.ScheduledExecutorService;

/**
 * Async Configuration — Email Sending Thread Pools
 * 
 * PROBLEM: Email sending is synchronous, blocking the HTTP response until
 * the email API responds (3-7 seconds). This creates poor UX and ties up
 * Tomcat threads.
 * 
 * FIX: Enable @Async with dedicated thread pools for email sending and scheduling.
 * The contact form saves to DB synchronously, then triggers email async.
 * 
 * RENDER FREE TIER CONSTRAINTS:
 * - Max 512MB RAM, so keep pool small
 * - CPU is shared, so don't create too many threads
 * - 2-3 threads is optimal for email workload
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Email executor: dedicated pool for sending emails.
     * 
     * corePoolSize=1: Start with 1 thread (free tier friendly)
     * maxPoolSize=2: Never exceed 2 threads (prevents memory exhaustion)
     * queueCapacity=50: Buffer up to 50 pending emails before rejecting
     * threadNamePrefix: Makes async threads identifiable in logs
     */
    @Bean(name = "emailExecutor")
    public Executor emailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(2);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("email-async-");
        
        // Rejection policy: don't discard — run in caller's thread as fallback
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        
        // Wait for tasks to complete on shutdown (graceful)
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        
        executor.initialize();
        return executor;
    }

    /**
     * General-purpose async executor for any other async needs.
     * Separate from email to prevent email backlog from affecting other operations.
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(2);
        executor.setQueueCapacity(20);
        executor.setThreadNamePrefix("task-async-");
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);
        executor.initialize();
        return executor;
    }

    /**
     * Email scheduler: for scheduling deduplication cleanup and retries.
     * Uses ScheduledExecutorService for scheduled tasks.
     * 
     * poolSize=1: Single thread adequate for deduplication cleanup
     * threadNamePrefix: Identifies scheduler threads in logs
     */
    @Bean(name = "emailScheduler")
    public ScheduledExecutorService emailScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("email-scheduler-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(10);
        scheduler.initialize();
        return scheduler.getScheduledExecutor();
    }
}
