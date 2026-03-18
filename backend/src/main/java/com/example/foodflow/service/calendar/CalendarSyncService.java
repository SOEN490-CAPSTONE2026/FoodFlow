package com.example.foodflow.service.calendar;

import com.example.foodflow.model.entity.CalendarIntegration;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.CalendarSyncPreference;
import com.example.foodflow.model.entity.SyncedCalendarEvent;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.CalendarSyncPreferenceRepository;
import com.example.foodflow.repository.SyncedCalendarEventRepository;
import com.example.foodflow.service.calendar.provider.GoogleCalendarProvider;
import com.example.foodflow.service.calendar.provider.CalendarProvider;
import com.example.foodflow.util.TimezoneResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for syncing events to external calendars
 * Orchestrates the sync process between FoodFlow and Google Calendar, Outlook, etc.
 */
@Service
@Transactional
public class CalendarSyncService {

    private static final Logger logger = LoggerFactory.getLogger(CalendarSyncService.class);

    @Autowired
    private CalendarIntegrationService calendarIntegrationService;

    @Autowired
    private CalendarEventService calendarEventService;

    @Autowired
    private GoogleCalendarProvider googleCalendarProvider;
    
    @Autowired
    private ClaimRepository claimRepository;
    
    @Autowired
    private CalendarSyncPreferenceRepository calendarSyncPreferenceRepository;
    
    @Autowired
    private SyncedCalendarEventRepository syncedCalendarEventRepository;

    /**
     * Asynchronously sync pending events for a user immediately after creation
     * Runs in background thread so it doesn't block the HTTP response
     */
    @Async
    public void syncUserPendingEventsAsync(User user) {
        logger.info("🔄 [ASYNC] Starting calendar sync for user {}...", user.getId());
        try {
            syncUserPendingEvents(user);
            logger.info("✅ [ASYNC] Calendar sync completed for user {}", user.getId());
        } catch (Exception e) {
            logger.error("❌ [ASYNC] Error syncing calendar for user {}", user.getId(), e);
        }
    }

    /**
     * Sync all pending events for a user to their connected calendars
     */
    public void syncUserPendingEvents(User user) {
        Optional<CalendarIntegration> integration = calendarIntegrationService.getUserIntegration(user);
        
        if (!integration.isPresent() || !integration.get().getIsConnected()) {
            logger.info("User {} has no active calendar integration", user.getId());
            return;
        }

        List<SyncedCalendarEvent> pendingEvents = calendarEventService.getUserPendingSyncEvents(user.getId());
        logger.info("Found {} pending events to sync for user {}", pendingEvents.size(), user.getId());

        for (SyncedCalendarEvent event : pendingEvents) {
            syncEventToCalendar(user, integration.get(), event);
        }
    }
    
    /**
     * Sync all upcoming pickups for a user - creates calendar events for active claims
     * and syncs them to the calendar
     */
    @Transactional
    public int syncAllUpcomingPickups(User user) {
        logger.info("🔄 Syncing all upcoming pickups for user {}", user.getId());
        
        // Check if user has calendar connected and sync enabled
        if (!calendarIntegrationService.isCalendarConnected(user, "GOOGLE")) {
            logger.info("User {} does not have calendar connected, skipping sync", user.getId());
            return 0;
        }
        
        Optional<CalendarSyncPreference> prefsOpt = calendarSyncPreferenceRepository.findByUserId(user.getId());
        // For manual sync, only check if claim events are enabled (not auto-sync enabled)
        if (!prefsOpt.isPresent() || !prefsOpt.get().getSyncClaimEvents()) {
            logger.info("User {} has claim event sync disabled", user.getId());
            return 0;
        }
        
        // Find all active claims where user is either donor or receiver
        List<Claim> activeClaims = claimRepository.findActiveClaimsForUser(user);
        logger.info("Found {} active claims for user {}", activeClaims.size(), user.getId());
        
        if (activeClaims.isEmpty()) {
            return 0;
        }
        
        int eventsCreated = 0;
        
        for (Claim claim : activeClaims) {
            try {
                // Check if calendar events already exist for this claim
                List<SyncedCalendarEvent> existingEvents = syncedCalendarEventRepository.findByClaimId(claim.getId());
                
                // Filter to events for this specific user
                boolean userHasEvent = existingEvents.stream()
                    .anyMatch(event -> event.getUser().getId().equals(user.getId()) && !event.getIsDeleted());
                
                if (userHasEvent) {
                    logger.debug("Calendar event already exists for user {} claim {}", user.getId(), claim.getId());
                    continue;
                }
                
                // Determine if user is donor or receiver
                boolean isDonor = claim.getSurplusPost().getDonor().getId().equals(user.getId());
                
                // Create calendar event (similar to ClaimService.createCalendarEventForPickup logic)
                SyncedCalendarEvent event = createPickupEventForClaim(claim, user, isDonor, prefsOpt.get());
                
                if (event != null) {
                    eventsCreated++;
                    logger.info("✅ Created calendar event for claim {} (user {} as {})", 
                               claim.getId(), user.getId(), isDonor ? "donor" : "receiver");
                }
                
            } catch (Exception e) {
                logger.error("Error creating calendar event for claim {}: {}", claim.getId(), e.getMessage(), e);
                // Continue with next claim
            }
        }
        
        logger.info("Created {} new calendar events for user {}", eventsCreated, user.getId());
        
        // Now sync all pending events to Google Calendar
        if (eventsCreated > 0) {
            syncUserPendingEventsAsync(user);
        }
        
        return eventsCreated;
    }

    /**
     * Sync a single event to the user's connected calendar
     */
    public void syncEventToCalendar(User user, CalendarIntegration integration, SyncedCalendarEvent event) {
        try {
            // Get the appropriate calendar provider
            CalendarProvider provider = getCalendarProvider(integration.getCalendarProvider());
            if (provider == null) {
                calendarEventService.markEventAsFailed(event, "Unsupported calendar provider: " + integration.getCalendarProvider());
                return;
            }

            // Get decrypted refresh token
            String refreshToken = calendarIntegrationService.getDecryptedRefreshToken(integration);

            // Check if event is deleted
            if (event.getIsDeleted()) {
                // Only delete from calendar if it was previously synced (has externalEventId)
                if (event.getExternalEventId() != null) {
                    deleteEventFromCalendar(provider, refreshToken, event);
                } else {
                    // Event was never synced to external calendar, just mark as completed
                    logger.info("Event {} marked for deletion but was never synced, skipping external delete", event.getId());
                    calendarEventService.markEventAsSynced(event, null);
                }
            } else if (event.getExternalEventId() != null) {
                // Event already synced, update it
                updateEventOnCalendar(provider, refreshToken, event);
            } else {
                // New event, create it
                createEventOnCalendar(provider, refreshToken, event);
            }

            // Update last successful sync timestamp
            calendarIntegrationService.updateLastSuccessfulSync(user);

        } catch (Exception e) {
            calendarEventService.markEventAsFailed(event, e.getMessage());
            logger.error("Error syncing event {} for user {}", event.getId(), user.getId(), e);
        }
    }

    /**
     * Create a new event on the external calendar
     */
    private void createEventOnCalendar(CalendarProvider provider, String refreshToken, 
                                      SyncedCalendarEvent event) throws CalendarProvider.CalendarProviderException {
        String externalEventId = provider.createEvent(refreshToken, event);
        calendarEventService.markEventAsSynced(event, externalEventId);
        logger.info("Event {} created on {} calendar with external ID {}", 
                   event.getId(), provider.getProviderName(), externalEventId);
    }

    /**
     * Update an existing event on the external calendar
     */
    private void updateEventOnCalendar(CalendarProvider provider, String refreshToken,
                                       SyncedCalendarEvent event) throws CalendarProvider.CalendarProviderException {
        provider.updateEvent(refreshToken, event);
        calendarEventService.markEventAsSynced(event, event.getExternalEventId());
        logger.info("Event {} updated on {} calendar", event.getId(), provider.getProviderName());
    }

    /**
     * Delete an event from the external calendar
     */
    private void deleteEventFromCalendar(CalendarProvider provider, String refreshToken,
                                        SyncedCalendarEvent event) throws CalendarProvider.CalendarProviderException {
        provider.deleteEvent(refreshToken, event.getExternalEventId());
        calendarEventService.markEventAsSynced(event, event.getExternalEventId());
        logger.info("Event {} deleted from {} calendar", event.getId(), provider.getProviderName());
    }

    /**
     * Get the appropriate calendar provider instance based on provider name
     */
    private CalendarProvider getCalendarProvider(String providerName) {
        return switch (providerName.toUpperCase()) {
            case "GOOGLE" -> googleCalendarProvider;
            // TODO: Add OutlookCalendarProvider once implemented
            // case "OUTLOOK" -> outlookCalendarProvider;
            default -> null;
        };
    }
    
    /**
     * Create a calendar event for a pickup claim
     * Extracted logic similar to ClaimService.createCalendarEventForPickup
     */
    private SyncedCalendarEvent createPickupEventForClaim(Claim claim, User user, boolean isDonor, 
                                                          CalendarSyncPreference prefs) {
        try {
            // Get pickup time details (stored in UTC in database)
            if (claim.getConfirmedPickupDate() == null || claim.getConfirmedPickupStartTime() == null) {
                logger.warn("Claim {} has no confirmed pickup time, cannot create calendar event", claim.getId());
                return null;
            }
            
            java.time.LocalDate pickupDateUTC = claim.getConfirmedPickupDate();
            java.time.LocalTime startTimeUTC = claim.getConfirmedPickupStartTime();
            java.time.LocalTime endTimeUTC = claim.getConfirmedPickupEndTime();
            
            // Convert UTC times to user's timezone
            String userTimezone = user.getTimezone() != null ? user.getTimezone() : "UTC";
            LocalDateTime startInUserTz = TimezoneResolver.convertDateTime(
                pickupDateUTC, startTimeUTC, "UTC", userTimezone
            );
            
            LocalDateTime endInUserTz;
            if (endTimeUTC != null) {
                endInUserTz = TimezoneResolver.convertDateTime(
                    pickupDateUTC, endTimeUTC, "UTC", userTimezone
                );
            } else {
                // Fallback: use event duration preference
                endInUserTz = startInUserTz.plusMinutes(prefs.getEventDuration());
            }
            
            // Build event title and description
            SurplusPost post = claim.getSurplusPost();
            String foodTitle = post.getTitle();
            String eventTitle = isDonor 
                ? "📦 Donation Pickup - " + foodTitle
                : "🍽️ Pickup Appointment - " + foodTitle;
            
            String eventDescription = buildPickupDescription(claim, user, isDonor);
            
            // Create the synced calendar event record
            SyncedCalendarEvent event = calendarEventService.createCalendarEvent(
                user,
                "CLAIM",
                eventTitle,
                eventDescription,
                startInUserTz,
                endInUserTz,
                userTimezone
            );
            
            // Link event to claim
            calendarEventService.linkEventToClaim(event, claim);
            
            return event;
            
        } catch (Exception e) {
            logger.error("Error creating pickup event for claim {}: {}", claim.getId(), e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Build event description for pickup
     */
    private String buildPickupDescription(Claim claim, User user, boolean isDonor) {
        SurplusPost post = claim.getSurplusPost();
        User donor = post.getDonor();
        User receiver = claim.getReceiver();
        
        StringBuilder desc = new StringBuilder();
        desc.append("🍽️ FoodFlow Pickup Event\\n\\n");
        desc.append("📦 Food: ").append(post.getTitle()).append("\\n");
        
        if (post.getQuantity() != null) {
            desc.append("📊 Quantity: ")
                .append(post.getQuantity().getValue())
                .append(" ")
                .append(post.getQuantity().getUnit())
                .append("\\n");
        }
        
        desc.append("\\n");
        
        if (isDonor) {
            // Donor's view
            String receiverName = (receiver.getOrganization() != null && receiver.getOrganization().getName() != null)
                ? receiver.getOrganization().getName()
                : "Receiver";
            desc.append("👤 Receiver: ").append(receiverName).append("\\n");
            if (receiver.getEmail() != null) {
                desc.append("📧 Contact: ").append(receiver.getEmail()).append("\\n");
            }
            if (receiver.getPhone() != null) {
                desc.append("📞 Phone: ").append(receiver.getPhone()).append("\\n");
            }
        } else {
            // Receiver's view
            String donorName = (donor.getOrganization() != null && donor.getOrganization().getName() != null)
                ? donor.getOrganization().getName()
                : "Donor";
            desc.append("👤 Donor: ").append(donorName).append("\\n");
            
            if (post.getPickupLocation() != null && post.getPickupLocation().getAddress() != null) {
                desc.append("📍 Location: ").append(post.getPickupLocation().getAddress()).append("\\n");
            }
            
            if (donor.getEmail() != null) {
                desc.append("📧 Contact: ").append(donor.getEmail()).append("\\n");
            }
            if (donor.getPhone() != null) {
                desc.append("📞 Phone: ").append(donor.getPhone()).append("\\n");
            }
        }
        
        if (post.getOtpCode() != null && !post.getOtpCode().isEmpty()) {
            desc.append("\\n🔐 Confirmation Code: ").append(post.getOtpCode()).append("\\n");
        }
        
        desc.append("\\n⏰ Please arrive on time. Contact the other party if there are any issues.");
        
        return desc.toString();
    }

    /**
     * Test connection to user's calendar
     */
    public boolean testCalendarConnection(User user, String calendarProvider) {
        try {
            Optional<CalendarIntegration> integration = calendarIntegrationService.getUserIntegration(user);
            
            if (!integration.isPresent()) {
                logger.warn("No calendar integration found for user {}", user.getId());
                throw new RuntimeException("Calendar not connected. Please connect your calendar first.");
            }
            
            if (!integration.get().getIsConnected()) {
                logger.warn("Calendar integration exists but is not connected for user {}", user.getId());
                throw new RuntimeException("Calendar is disconnected. Please reconnect your calendar.");
            }

            CalendarProvider provider = getCalendarProvider(calendarProvider);
            if (provider == null) {
                logger.warn("Unsupported calendar provider: {}", calendarProvider);
                throw new RuntimeException("Unsupported calendar provider: " + calendarProvider);
            }

            String refreshToken = calendarIntegrationService.getDecryptedRefreshToken(integration.get());
            provider.refreshAccessToken(refreshToken); // Test by refreshing token
            
            logger.info("Calendar connection test successful for user {}", user.getId());
            return true;
        } catch (RuntimeException e) {
            // Re-throw RuntimeException with the descriptive message
            throw e;
        } catch (Exception e) {
            logger.error("Calendar connection test failed for user {}", user.getId(), e);
            throw new RuntimeException("Connection test failed: " + e.getMessage(), e);
        }
    }
}
