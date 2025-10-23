package com.example.foodflow.model.types;

public enum PostStatus {
    AVAILABLE,
    READY_FOR_PICKUP,
    EXPIRED,
    CLAIMED,
    NOT_COMPLETED,
    COMPLETED;

    public String getDisplayName(){
        String name = this.name();
        return name.charAt(0) + name.substring(1).toLowerCase().replace('_', ' ');
    }
}
