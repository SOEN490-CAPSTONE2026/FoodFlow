package com.example.foodflow.model.dto;
import jakarta.validation.constraints.NotBlank;


public class LogoutRequest {
    @NotBlank
    private String email;

    @NotBlank
    private String password;

    public LogoutRequest(String email, String password){
        this.email = email;
        this.password = password;
    }

    public LogoutRequest(){}

    public String getEmail(){
        return email;
    }

    public void setEmail(String email){
        this.email = email;
    }

    public String getPassword(){
        return password;
    }

    public void setPassword(String password){
        this.password = password;
    }

}