package com.example.userservice.util;

import com.example.userservice.model.User;
import lombok.experimental.UtilityClass;

import java.math.BigDecimal;
import java.util.Optional;


@UtilityClass
public class UserExceptionUtil {
    public static User throwNotFound(Optional<User> optionalUser){
        return optionalUser.orElseThrow(()->new RuntimeException("User Not Found"));
    }
    public static void validateAmount(BigDecimal amount){
        if (amount.compareTo(BigDecimal.ZERO) <= 0){
            throw new RuntimeException("Amount must be greater than 0");
        }
    }

}
