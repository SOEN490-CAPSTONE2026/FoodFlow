package com.example.foodflow.controller;

import com.example.foodflow.model.dto.PickupConfirmationRequest;
import com.example.foodflow.model.dto.PickupConfirmationResponse;
import com.example.foodflow.service.SurplusService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pickup")
@CrossOrigin(origins = "${spring.web.cors.allowed-origins}")
public class PickupController {

    private final SurplusService surplusService;

    public PickupController(SurplusService surplusService) {
        this.surplusService = surplusService;
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasAuthority('DONOR')")
    public ResponseEntity<PickupConfirmationResponse> confirmPickup(
            @RequestBody PickupConfirmationRequest request) {

        try {
            PickupConfirmationResponse response =
                    surplusService.confirmPickup(request.getPostId(), request.getOtp());

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new PickupConfirmationResponse(false, ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new PickupConfirmationResponse(false, "Unexpected server error"));
        }
    }
}
