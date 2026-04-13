package com.example.foodflow.service;
import brevo.ApiClient;
import brevo.Configuration;
import brevo.auth.ApiKeyAuth;
import brevoApi.TransactionalEmailsApi;
import org.springframework.stereotype.Component;
@Component
public class TransactionalEmailClientFactory {
    public TransactionalEmailsApi create(String apiKey) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth auth = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        auth.setApiKey(apiKey);
        return new TransactionalEmailsApi();
    }
}
