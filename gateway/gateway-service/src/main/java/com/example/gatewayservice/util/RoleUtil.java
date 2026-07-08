package com.example.gatewayservice.util;

import lombok.experimental.UtilityClass;

@UtilityClass
public class RoleUtil {

    public static String normalize(String role) {
        if (role == null) return null;
        return role.startsWith("ROLE_") ? role : "ROLE_" + role;
    }
}
