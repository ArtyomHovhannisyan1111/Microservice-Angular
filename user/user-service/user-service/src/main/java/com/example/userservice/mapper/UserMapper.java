package com.example.userservice.mapper;

import com.example.userservice.dto.UserRegisterDto;
import com.example.userservice.dto.UserResponse;
import com.example.userservice.model.User;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class UserMapper {
    public User toEntity(UserRegisterDto userRegisterDto) {
        if (userRegisterDto == null) {
            return null;
        }
        User user = new User();
        user.setUsername(userRegisterDto.getUsername());
        user.setPassword(userRegisterDto.getPassword());
        user.setEmail(userRegisterDto.getEmail());
        user.setRole("USER");
        user.setBalance(BigDecimal.ZERO);
        return user;
    }
    public UserResponse toResponse(User user) {
        if(user == null) {
            return null;
        }
        UserResponse userResponse = new UserResponse();
        userResponse.setId(user.getId());
        userResponse.setUsername(user.getUsername());
        userResponse.setEmail(user.getEmail());
        userResponse.setRole(user.getRole());
        userResponse.setBalance(user.getBalance());
        return userResponse;
    }
}
