package com.example.foodflow.model.types;

public enum PostStatus {
    AVAILABLE,
    EXPIRED,
    CLAIMED;

    @Override
    public String toString(){
        String name = this.name();
        return name.charAt(0) + name.substring(1).toLowerCase().replace('_', ' ');
    }
}
