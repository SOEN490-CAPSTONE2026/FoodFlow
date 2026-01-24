package com.example.foodflow.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;

@Service
public class BusinessMetricsService {

    private final MeterRegistry meterRegistry;
    private final ClaimRepository claimRepository;
    private final SurplusPostRepository surplusPostRepository;

    // Surplus Post Metrics
    private final Counter surplusPostCreatedCounter;
    private final Counter surplusPostClaimedCounter;
    private final Counter surplusPostCompletedCounter;

    // Claim Metrics
    private final Counter claimCreatedCounter;
    private final Counter claimCancelledCounter;
    private final Counter claimCompletedCounter;

    // Message Metrics
    private final Counter messagesSentCounter;
    private final Counter messagesReceivedCounter;

    // Recommendation Metrics
    private final Counter recommendationsCalculatedCounter;
    private final Counter recommendationsHighScoreCounter;

    // Notification Metrics
    private final Counter notificationsSentCounter;
    private final Counter notificationsDeliveredCounter;
    private final Counter notificationsFailedCounter;
    private final Counter notificationsFilteredCounter;

    // Timeline Metrics
    private final Counter timelineEventsCreatedCounter;

    // User Profile Metrics
    private final Counter profileUpdatesCounter;
    private final Counter regionSettingsUpdatesCounter;

    // Geolocation Metrics
    private final Counter distanceCalculationsCounter;
    private final Counter locationSearchesCounter;

    // Food Category Metrics
    private final Counter foodCategoryPostsCounter;

    // Dispute/Report Metrics
    private final Counter disputesCreatedCounter;
    private final Counter disputesResolvedCounter;
    private final Counter disputesRejectedCounter;

    // Feedback Metrics
    private final Counter feedbackSubmittedCounter;
    private final Counter ratingsGivenCounter;

    // Admin Action Metrics
    private final Counter adminUserActionsCounter;
    private final Counter adminDisputeActionsCounter;
    private final Counter adminAlertsSentCounter;

    // WebSocket Metrics
    private final Counter websocketConnectionsCounter;
    private final Counter websocketDisconnectionsCounter;
    private final Counter websocketMessagesCounter;

    // Email Metrics
    private final Counter emailsSentCounter;
    private final Counter emailsFailedCounter;

    public BusinessMetricsService(MeterRegistry meterRegistry,
                                 ClaimRepository claimRepository,
                                 SurplusPostRepository surplusPostRepository) {
        this.meterRegistry = meterRegistry;
        this.claimRepository = claimRepository;
        this.surplusPostRepository = surplusPostRepository;

        // Initialize counters
        this.surplusPostCreatedCounter = Counter.builder("surplus.posts.created")
                .description("Total surplus food posts created")
                .register(meterRegistry);

        this.surplusPostClaimedCounter = Counter.builder("surplus.posts.claimed")
                .description("Total surplus posts claimed")
                .register(meterRegistry);

        this.surplusPostCompletedCounter = Counter.builder("surplus.posts.completed")
                .description("Total surplus posts completed")
                .register(meterRegistry);

        this.claimCreatedCounter = Counter.builder("claims.created")
                .description("Total claims created")
                .register(meterRegistry);

        this.claimCancelledCounter = Counter.builder("claims.cancelled")
                .description("Total claims cancelled")
                .register(meterRegistry);

        this.claimCompletedCounter = Counter.builder("claims.completed")
                .description("Total claims completed")
                .register(meterRegistry);

        this.messagesSentCounter = Counter.builder("messages.sent")
                .description("Total messages sent")
                .register(meterRegistry);

        this.messagesReceivedCounter = Counter.builder("messages.received")
                .description("Total messages received")
                .register(meterRegistry);

        // Initialize new counters
        this.recommendationsCalculatedCounter = Counter.builder("recommendations.calculated")
                .description("Total recommendation calculations performed")
                .register(meterRegistry);

        this.recommendationsHighScoreCounter = Counter.builder("recommendations.high_score")
                .description("Total recommendations with high scores (>80)")
                .register(meterRegistry);

        this.notificationsSentCounter = Counter.builder("notifications.sent")
                .description("Total notifications sent")
                .register(meterRegistry);

        this.notificationsDeliveredCounter = Counter.builder("notifications.delivered")
                .description("Total notifications successfully delivered")
                .register(meterRegistry);

        this.notificationsFailedCounter = Counter.builder("notifications.failed")
                .description("Total notifications that failed to deliver")
                .register(meterRegistry);

        this.notificationsFilteredCounter = Counter.builder("notifications.filtered")
                .description("Total notifications filtered out by preferences")
                .register(meterRegistry);

        this.timelineEventsCreatedCounter = Counter.builder("timeline.events.created")
                .description("Total timeline events created")
                .register(meterRegistry);

        this.profileUpdatesCounter = Counter.builder("user.profiles.updated")
                .description("Total user profile updates")
                .register(meterRegistry);

        this.regionSettingsUpdatesCounter = Counter.builder("user.region.settings.updated")
                .description("Total region settings updates")
                .register(meterRegistry);

        this.distanceCalculationsCounter = Counter.builder("geolocation.distance.calculated")
                .description("Total distance calculations performed")
                .register(meterRegistry);

        this.locationSearchesCounter = Counter.builder("geolocation.location.searches")
                .description("Total location-based searches")
                .register(meterRegistry);

        this.foodCategoryPostsCounter = Counter.builder("food.categories.posts")
                .description("Total posts created by food category")
                .register(meterRegistry);

        // Initialize dispute counters
        this.disputesCreatedCounter = Counter.builder("disputes.created")
                .description("Total disputes/reports created")
                .register(meterRegistry);

        this.disputesResolvedCounter = Counter.builder("disputes.resolved")
                .description("Total disputes resolved")
                .register(meterRegistry);

        this.disputesRejectedCounter = Counter.builder("disputes.rejected")
                .description("Total disputes rejected")
                .register(meterRegistry);

        // Initialize feedback counters
        this.feedbackSubmittedCounter = Counter.builder("feedback.submitted")
                .description("Total feedback submissions")
                .register(meterRegistry);

        this.ratingsGivenCounter = Counter.builder("ratings.given")
                .description("Total ratings given")
                .register(meterRegistry);

        // Initialize admin action counters
        this.adminUserActionsCounter = Counter.builder("admin.user.actions")
                .description("Total admin actions on users")
                .register(meterRegistry);

        this.adminDisputeActionsCounter = Counter.builder("admin.dispute.actions")
                .description("Total admin actions on disputes")
                .register(meterRegistry);

        this.adminAlertsSentCounter = Counter.builder("admin.alerts.sent")
                .description("Total admin alerts sent")
                .register(meterRegistry);

        // Initialize websocket counters
        this.websocketConnectionsCounter = Counter.builder("websocket.connections")
                .description("Total websocket connections established")
                .register(meterRegistry);

        this.websocketDisconnectionsCounter = Counter.builder("websocket.disconnections")
                .description("Total websocket disconnections")
                .register(meterRegistry);

        this.websocketMessagesCounter = Counter.builder("websocket.messages")
                .description("Total websocket messages sent")
                .register(meterRegistry);

        // Initialize email counters
        this.emailsSentCounter = Counter.builder("emails.sent")
                .description("Total emails sent")
                .register(meterRegistry);

        this.emailsFailedCounter = Counter.builder("emails.failed")
                .description("Total email delivery failures")
                .register(meterRegistry);
    }

    private void registerActiveClaimsGauges() {
        // Active claims gauge
        Gauge.builder("claims.active", claimRepository, repo -> 
                repo.countByStatus(ClaimStatus.ACTIVE))
                .description("Number of active claims")
                .register(meterRegistry);

        // Cancelled claims gauge
        Gauge.builder("claims.cancelled.total", claimRepository, repo -> 
                repo.countByStatus(ClaimStatus.CANCELLED))
                .description("Total number of cancelled claims")
                .register(meterRegistry);

        // Completed claims gauge
        Gauge.builder("claims.completed.total", claimRepository, repo -> 
                repo.countByStatus(ClaimStatus.COMPLETED))
                .description("Total number of completed claims")
                .register(meterRegistry);
    }

    // Surplus Post Methods
    public void incrementSurplusPostCreated() {
        surplusPostCreatedCounter.increment();
    }

    public void incrementSurplusPostClaimed() {
        surplusPostClaimedCounter.increment();
    }

    public void incrementSurplusPostCompleted() {
        surplusPostCompletedCounter.increment();
    }

    // Claim Methods
    public void incrementClaimCreated() {
        claimCreatedCounter.increment();
    }

    public void incrementClaimCancelled() {
        claimCancelledCounter.increment();
    }

    public void incrementClaimCompleted() {
        claimCompletedCounter.increment();
    }

    // Message Methods
    public void incrementMessagesSent() {
        messagesSentCounter.increment();
    }

    public void incrementMessagesReceived() {
        messagesReceivedCounter.increment();
    }

    // Recommendation Methods
    public void incrementRecommendationsCalculated() {
        recommendationsCalculatedCounter.increment();
    }

    public void incrementRecommendationsHighScore() {
        recommendationsHighScoreCounter.increment();
    }

    // Notification Methods
    public void incrementNotificationsSent() {
        notificationsSentCounter.increment();
    }

    public void incrementNotificationsDelivered() {
        notificationsDeliveredCounter.increment();
    }

    public void incrementNotificationsFailed() {
        notificationsFailedCounter.increment();
    }

    public void incrementNotificationsFiltered() {
        notificationsFilteredCounter.increment();
    }

    // Timeline Methods
    public void incrementTimelineEventsCreated() {
        timelineEventsCreatedCounter.increment();
    }

    // User Profile Methods
    public void incrementProfileUpdates() {
        profileUpdatesCounter.increment();
    }

    public void incrementRegionSettingsUpdates() {
        regionSettingsUpdatesCounter.increment();
    }

    // Geolocation Methods
    public void incrementDistanceCalculations() {
        distanceCalculationsCounter.increment();
    }

    public void incrementLocationSearches() {
        locationSearchesCounter.increment();
    }

    // Food Category Methods
    public void incrementFoodCategoryPosts(String category) {
        Counter.builder("food.categories.posts")
                .tag("category", category)
                .register(meterRegistry)
                .increment();
    }

    // Dispute Methods
    public void incrementDisputesCreated() {
        disputesCreatedCounter.increment();
    }

    public void incrementDisputesResolved() {
        disputesResolvedCounter.increment();
    }

    public void incrementDisputesRejected() {
        disputesRejectedCounter.increment();
    }

    public void incrementDisputeStatusChange(String fromStatus, String toStatus) {
        Counter.builder("disputes.status.changed")
                .tag("from", fromStatus)
                .tag("to", toStatus)
                .register(meterRegistry)
                .increment();
    }

    // Feedback Methods
    public void incrementFeedbackSubmitted() {
        feedbackSubmittedCounter.increment();
    }

    public void incrementRatingsGiven(int rating) {
        ratingsGivenCounter.increment();
        Counter.builder("ratings.by.score")
                .tag("score", String.valueOf(rating))
                .register(meterRegistry)
                .increment();
    }

    // Admin Action Methods
    public void incrementAdminUserAction(String action) {
        adminUserActionsCounter.increment();
        Counter.builder("admin.user.actions")
                .tag("action", action)
                .register(meterRegistry)
                .increment();
    }

    public void incrementAdminDisputeAction(String action) {
        adminDisputeActionsCounter.increment();
        Counter.builder("admin.dispute.actions")
                .tag("action", action)
                .register(meterRegistry)
                .increment();
    }

    public void incrementAdminAlertsSent() {
        adminAlertsSentCounter.increment();
    }

    // WebSocket Methods
    public void incrementWebsocketConnections() {
        websocketConnectionsCounter.increment();
    }

    public void incrementWebsocketDisconnections() {
        websocketDisconnectionsCounter.increment();
    }

    public void incrementWebsocketMessages() {
        websocketMessagesCounter.increment();
    }

    // Email Methods
    public void incrementEmailsSent() {
        emailsSentCounter.increment();
    }

    public void incrementEmailsFailed() {
        emailsFailedCounter.increment();
    }

    public void incrementEmailByType(String emailType) {
        Counter.builder("emails.by.type")
                .tag("type", emailType)
                .register(meterRegistry)
                .increment();
    }

    // Timer for service method execution
    public Timer.Sample startTimer() {
        return Timer.start(meterRegistry);
    }

    public void recordTimer(Timer.Sample sample, String metricName, String... tags) {
        Timer.Builder timerBuilder = Timer.builder(metricName);
        for (int i = 0; i < tags.length - 1; i += 2) {
            timerBuilder.tag(tags[i], tags[i + 1]);
        }
        sample.stop(timerBuilder.register(meterRegistry));
    }
}
