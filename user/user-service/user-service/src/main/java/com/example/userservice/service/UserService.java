package com.example.userservice.service;

import com.example.userservice.model.User;
import com.example.userservice.repository.UserRepository;
import com.example.userservice.util.UserExceptionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    @Transactional
    public User registeredUser(User user) {
        return userRepository.findByUsername(user.getUsername())
                .orElseGet(() -> userRepository.save(user));
    }
    @Transactional(readOnly = true)
    public User getById(Long id) {
        return UserExceptionUtil.throwNotFound(userRepository.findById(id));
    }
    @Transactional
    public User topUpBalance(Long id, BigDecimal balance) {
        UserExceptionUtil.validateAmount(balance);
        User user = UserExceptionUtil.throwNotFound(userRepository.findWithLockById(id));
        user.setBalance(user.getBalance().add(balance));
        return userRepository.save(user);
    }

    @Transactional
    public boolean deductBalance(Long id, BigDecimal balance) {
        UserExceptionUtil.validateAmount(balance);
        User user = UserExceptionUtil.throwNotFound(userRepository.findWithLockById(id));
        if (user.getBalance().compareTo(balance) < 0) {
            return false;
        }
        user.setBalance(user.getBalance().subtract(balance));
        userRepository.save(user);
        return true;
    }

}
