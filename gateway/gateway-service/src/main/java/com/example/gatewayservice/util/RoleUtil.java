package com.example.gatewayservice.util;

import lombok.experimental.UtilityClass;

import java.util.List;

@UtilityClass
public class RoleUtil {


    public static String normalize(String role) {
        if (role == null) return null;
        return role.startsWith("ROLE_") ? role : "ROLE_" + role;
    }

    public static List<String> toList(String role) {
        return role == null ? List.of() : List.of(role);
    }
}
