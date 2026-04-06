package com.example.foodflow.service;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.DistributionSummary;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Service;
import com.example.foodflow.repository.ClaimRepository;
@Service
public class BusinessMetricsService {
    private final MeterRegistry meterRegistry;
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
    // Payment Metrics
    private final Counter paymentCreatedCounter;
    private final Counter paymentSucceededCounter;
    private final Counter paymentFailedCounter;
    private final Counter refundProcessedCounter;
    // Release 3 - Donation Metrics
    private final Counter donationsCreatedCounter;
    private final Counter donationsClaimedCounter;
    private final Counter donationsCompletedCounter;
    private final Counter foodRescuedKgCounter;
    private final DistributionSummary donationQuantityDistribution;
    // Release 3 - Gauges (AtomicInteger-backed for real-time reads)
    private final AtomicInteger activeUsersGauge = new AtomicInteger(0);
    private final AtomicInteger availableDonationsGauge = new AtomicInteger(0);
    private final AtomicInteger pendingClaimsGauge = new AtomicInteger(0);
    // Release 3 - External Service Metrics
    private final Counter smsSentCounter;
    private final Counter smsFailedCounter;
    // Release 3 - Database Slow Query Metrics
    private final Counter slowQueriesCounter;
    public BusinessMetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
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
        // Initialize payment counters
        this.paymentCreatedCounter = Counter.builder("payments.created")
                .description("Total payments created")
                .register(meterRegistry);
        this.paymentSucceededCounter = Counter.builder("payments.succeeded")
                .description("Total payments succeeded")
                .register(meterRegistry);
        this.paymentFailedCounter = Counter.builder("payments.failed")
                .description("Total payments failed")
                .register(meterRegistry);
        this.refundProcessedCounter = Counter.builder("refunds.processed")
                .description("Total refunds processed")
                .register(meterRegistry);
        // Release 3 - Donation Metrics
        this.donationsCreatedCounter = Counter.builder("donations.created.total")
                .description("Total donations posted")
                .register(meterRegistry);
        this.donationsClaimedCounter = Counter.builder("donations.claimed.total")
                .description("Total donations claimed")
                .register(meterRegistry);
        this.donationsCompletedCounter = Counter.builder("donations.completed.total")
                .description("Total donations completed and food transferred")
                .register(meterRegistry);
        this.foodRescuedKgCounter = Counter.builder("food.rescued.kg.total")
                .description("Total food rescued in kilograms")
                .baseUnit("kg")
                .register(meterRegistry);
        this.donationQuantityDistribution = DistributionSummary.builder("donation.quantity.distribution")
                .description("Distribution of donation quantities in kg")
                .baseUnit("kg")
                .publishPercentileHistogram(true)
                .register(meterRegistry);
        Gauge.builder("active_users", this.activeUsersGauge, AtomicInteger::get)
                .description("Currently active users")
                .register(meterRegistry);
        Gauge.builder("available_donations", this.availableDonationsGauge, AtomicInteger::get)
                .description("Currently available donations")
                .register(meterRegistry);
        Gauge.builder("pending_claims", this.pendingClaimsGauge, AtomicInteger::get)
                .description("Currently pending claims")
                .register(meterRegistry);
        // Release 3 - External Service Metrics
        this.smsSentCounter = Counter.builder("sms.sent.total")
                .description("Total SMS messages sent")
                .register(meterRegistry);
        this.smsFailedCounter = Counter.builder("sms.failed.total")
                .description("Total SMS delivery failures")
                .register(meterRegistry);
        // Release 3 - Database Slow Queries
        this.slowQueriesCounter = Counter.builder("database.slow.queries.total")
                .description("Total slow database queries exceeding threshold")
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
    // Payment Methods
    public void incrementPaymentCreated() {
        paymentCreatedCounter.increment();
    }
    public void incrementPaymentSucceeded() {
        paymentSucceededCounter.increment();
    }
    public void incrementPaymentFailed() {
        paymentFailedCounter.increment();
    }
    public void incrementRefundProcessed() {
        refundProcessedCounter.increment();
    }
    public void incrementPaymentByType(String paymentType) {
        Counter.builder("payments.by.type")
                .tag("type", paymentType)
                .register(meterRegistry)
                .increment();
    }
    public void incrementPaymentByCurrency(String currency) {
        Counter.builder("payments.by.currency")
                .tag("currency", currency)
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
    // Release 3 - Donation Methods
    public void incrementDonationsCreated() {
        donationsCreatedCounter.increment();
    }
    public void incrementDonationsClaimed() {
        donationsClaimedCounter.increment();
    }
    public void incrementDonationsCompleted() {
        donationsCompletedCounter.increment();
    }
    public void recordFoodRescued(double kg) {
        foodRescuedKgCounter.increment(kg);
    }
    public void recordDonationQuantity(double kg) {
        donationQuantityDistribution.record(kg);
    }
    // Release 3 - Gauge Setters
    public void setActiveUsers(int count) {
        activeUsersGauge.set(count);
    }
    public void setAvailableDonations(int count) {
        availableDonationsGauge.set(count);
    }
    public void setPendingClaims(int count) {
        pendingClaimsGauge.set(count);
    }
    // Release 3 - Timer Methods
    public void recordDonationCreationDuration(Timer.Sample sample) {
        sample.stop(Timer.builder("donation.creation.duration")
                .description("Time to process a donation creation")
                .publishPercentileHistogram(true)
                .register(meterRegistry));
    }
    public void recordClaimProcessingDuration(Timer.Sample sample) {
        sample.stop(Timer.builder("claim.processing.duration")
                .description("Time to process a claim end-to-end")
                .publishPercentileHistogram(true)
                .register(meterRegistry));
    }
    public void recordEmailDeliveryDuration(Timer.Sample sample) {
        sample.stop(Timer.builder("email.delivery.duration")
                .description("Time to deliver an email via the mail service")
                .publishPercentileHistogram(true)
                .register(meterRegistry));
    }
    // Release 3 - External Service Methods (OpenAI)
    public void incrementOpenAiCalls(String operation) {
        Counter.builder("openai.api.calls.total")
                .description("Total OpenAI API calls")
                .tag("operation", operation)
                .tag("status", "success")
                .register(meterRegistry)
                .increment();
    }
    public void incrementOpenAiCallsFailed(String operation) {
        Counter.builder("openai.api.calls.total")
                .description("Total OpenAI API calls")
                .tag("operation", operation)
                .tag("status", "failed")
                .register(meterRegistry)
                .increment();
    }
    public void recordOpenAiDuration(Timer.Sample sample, String operation) {
        sample.stop(Timer.builder("openai.api.duration")
                .description("OpenAI API call duration")
                .tag("operation", operation)
                .publishPercentileHistogram(true)
                .register(meterRegistry));
    }
    // Release 3 - External Service Methods (SMS)
    public void incrementSmsSent() {
        smsSentCounter.increment();
    }
    public void incrementSmsFailed() {
        smsFailedCounter.increment();
    }
    public void recordSmsDeliveryDuration(Timer.Sample sample) {
        sample.stop(Timer.builder("sms.delivery.duration")
                .description("SMS delivery duration")
                .publishPercentileHistogram(true)
                .register(meterRegistry));
    }
    // Release 3 - Database Slow Query Methods
    public void incrementSlowQuery(String queryContext) {
        slowQueriesCounter.increment();
        Counter.builder("database.slow.queries.total")
                .description("Slow database queries by context")
                .tag("context", queryContext)
                .register(meterRegistry)
                .increment();
    }
}
