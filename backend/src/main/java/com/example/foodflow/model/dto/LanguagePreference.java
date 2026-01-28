package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class LanguagePreference {
    
    @NotBlank
    @Pattern(
        regexp = "en|fr|es|zh|ar|pt",
        message = "languagePreference must be one of: en, fr, es, zh, ar, pt"
    )
    private String languagePreference;

    public String getLanguagePreference() { return languagePreference; }
    public void setLanguagePreference(String languagePreference) {
        this.languagePreference = languagePreference;
    }
}

