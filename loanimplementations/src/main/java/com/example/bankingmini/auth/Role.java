//package com.example.bankingmini.auth;
//
//public enum Role {
//    USER("USER"),
//    ADMIN("ADMIN"),
//    LOAN_OFFICER("LOAN_OFFICER");
//
//    private final String value;
//
//    Role(String value) {
//        this.value = value;
//    }
//
//    public String getValue() {
//        return value;
//    }
//
//    public static Role fromString(String role) {
//        for (Role r : Role.values()) {
//            if (r.value.equalsIgnoreCase(role)) {
//                return r;
//            }
//        }
//        throw new IllegalArgumentException("Invalid role: " + role);
//    }
//}
