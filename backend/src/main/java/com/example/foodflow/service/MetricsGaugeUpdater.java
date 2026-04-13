package com.example.foodflow.service;
import com.example.foodflow.model.entity.AccountStatus;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.util.concurrent.atomic.AtomicReference;
/**
 * Periodically refreshes Micrometer Gauge metrics that reflect real-time
 * platform state by querying the database every 30 seconds.
 *
 * Gauges updated:
 *   active_users                       – users with AccountStatus.ACTIVE
 *   available_donations                – surplus posts with PostStatus.AVAILABLE
 *   pending_claims                     – claims with ClaimStatus.ACTIVE
 *   foodflow.donation.completion.rate  – COMPLETED / (COMPLETED + NOT_COMPLETED)
 *                                        alert fires when < 0.60 (60%)
 */
@Component
public class MetricsGaugeUpdater {
    private static final Logger log = LoggerFactory.getLogger(MetricsGaugeUpdater.class);
    private final BusinessMetricsService businessMetricsService;
    private final UserRepository userRepository;
    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;
    // Backing value for the donation completion rate gauge (default 1.0 until first DB refresh)
    private final AtomicReference<Double> donationCompletionRate = new AtomicReference<>(1.0);
    public MetricsGaugeUpdater(BusinessMetricsService businessMetricsService,
                                UserRepository userRepository,
                                SurplusPostRepository surplusPostRepository,
                                ClaimRepository claimRepository,
                                MeterRegistry meterRegistry) {
        this.businessMetricsService = businessMetricsService;
        this.userRepository = userRepository;
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
        Gauge.builder("foodflow.donation.completion.rate", donationCompletionRate, AtomicReference::get)
                .description("Ratio of COMPLETED donations to resolved donations (COMPLETED + NOT_COMPLETED). "
                        + "Alert fires when < 0.60.")
                .register(meterRegistry);
    }
    @Scheduled(fixedDelay = 30000)
    public void refreshGauges() {
        try {
            int activeUsers = (int) userRepository.countByAccountStatus(AccountStatus.ACTIVE);
            int availableDonations = (int) surplusPostRepository.countByStatus(PostStatus.AVAILABLE);
            int pendingClaims = (int) claimRepository.countByStatus(ClaimStatus.ACTIVE);
            businessMetricsService.setActiveUsers(activeUsers);
            businessMetricsService.setAvailableDonations(availableDonations);
            businessMetricsService.setPendingClaims(pendingClaims);
            // Donation completion rate: completed / (completed + not_completed)
            long completed = surplusPostRepository.countByStatus(PostStatus.COMPLETED);
            long notCompleted = surplusPostRepository.countByStatus(PostStatus.NOT_COMPLETED);
            long resolved = completed + notCompleted;
            donationCompletionRate.set(resolved == 0 ? 1.0 : (double) completed / resolved);
            log.debug("Gauge refresh: activeUsers={}, availableDonations={}, pendingClaims={}, donationCompletionRate={}",
                    activeUsers, availableDonations, pendingClaims, donationCompletionRate.get());
        } catch (Exception e) {
            log.error("Failed to refresh platform gauges", e);
        }
    }
}
