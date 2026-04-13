package com.example.foodflow.service;
import com.example.foodflow.model.entity.AccountStatus;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
class MetricsGaugeUpdaterTest {
    @Mock private BusinessMetricsService businessMetricsService;
    @Mock private UserRepository userRepository;
    @Mock private SurplusPostRepository surplusPostRepository;
    @Mock private ClaimRepository claimRepository;
    private MeterRegistry meterRegistry;
    private MetricsGaugeUpdater gaugeUpdater;
    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        gaugeUpdater = new MetricsGaugeUpdater(
                businessMetricsService, userRepository, surplusPostRepository, claimRepository, meterRegistry);
    }
    @Test
    void constructor_RegistersDonationCompletionRateGauge() {
        Gauge gauge = meterRegistry.find("foodflow.donation.completion.rate").gauge();
        assertThat(gauge).isNotNull();
    }
    @Test
    void constructor_CompletionRateDefaultsToOne() {
        Gauge gauge = meterRegistry.find("foodflow.donation.completion.rate").gauge();
        assertThat(gauge.value()).isEqualTo(1.0);
    }
    @Test
    void refreshGauges_QueriesReposAndUpdatesBusinessMetrics() {
        when(userRepository.countByAccountStatus(AccountStatus.ACTIVE)).thenReturn(10L);
        when(surplusPostRepository.countByStatus(PostStatus.AVAILABLE)).thenReturn(5L);
        when(claimRepository.countByStatus(ClaimStatus.ACTIVE)).thenReturn(3L);
        when(surplusPostRepository.countByStatus(PostStatus.COMPLETED)).thenReturn(8L);
        when(surplusPostRepository.countByStatus(PostStatus.NOT_COMPLETED)).thenReturn(2L);
        gaugeUpdater.refreshGauges();
        verify(businessMetricsService).setActiveUsers(10);
        verify(businessMetricsService).setAvailableDonations(5);
        verify(businessMetricsService).setPendingClaims(3);
    }
    @Test
    void refreshGauges_SetsCorrectCompletionRate() {
        when(userRepository.countByAccountStatus(any())).thenReturn(0L);
        when(claimRepository.countByStatus(any())).thenReturn(0L);
        when(surplusPostRepository.countByStatus(PostStatus.AVAILABLE)).thenReturn(0L);
        when(surplusPostRepository.countByStatus(PostStatus.COMPLETED)).thenReturn(6L);
        when(surplusPostRepository.countByStatus(PostStatus.NOT_COMPLETED)).thenReturn(4L);
        gaugeUpdater.refreshGauges();
        Gauge gauge = meterRegistry.find("foodflow.donation.completion.rate").gauge();
        assertThat(gauge.value()).isEqualTo(0.6);
    }
    @Test
    void refreshGauges_NoResolvedDonations_SetsCompletionRateToOne() {
        when(userRepository.countByAccountStatus(any())).thenReturn(0L);
        when(claimRepository.countByStatus(any())).thenReturn(0L);
        when(surplusPostRepository.countByStatus(any())).thenReturn(0L);
        gaugeUpdater.refreshGauges();
        Gauge gauge = meterRegistry.find("foodflow.donation.completion.rate").gauge();
        assertThat(gauge.value()).isEqualTo(1.0);
    }
    @Test
    void refreshGauges_AllCompleted_SetsRateToOne() {
        when(userRepository.countByAccountStatus(any())).thenReturn(0L);
        when(claimRepository.countByStatus(any())).thenReturn(0L);
        when(surplusPostRepository.countByStatus(PostStatus.AVAILABLE)).thenReturn(0L);
        when(surplusPostRepository.countByStatus(PostStatus.COMPLETED)).thenReturn(10L);
        when(surplusPostRepository.countByStatus(PostStatus.NOT_COMPLETED)).thenReturn(0L);
        gaugeUpdater.refreshGauges();
        Gauge gauge = meterRegistry.find("foodflow.donation.completion.rate").gauge();
        assertThat(gauge.value()).isEqualTo(1.0);
    }
    @Test
    void refreshGauges_RepositoryThrows_DoesNotPropagateException() {
        when(userRepository.countByAccountStatus(any())).thenThrow(new RuntimeException("DB down"));
        assertThatCode(() -> gaugeUpdater.refreshGauges()).doesNotThrowAnyException();
    }
}
