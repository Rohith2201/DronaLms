package com.drona.lms.auth.service;

import com.drona.lms.auth.dto.AuthRequest;
import com.drona.lms.auth.dto.AuthResponse;
import com.drona.lms.auth.dto.RegisterRequest;
import com.drona.lms.domain.entity.User;
import com.drona.lms.domain.enums.RoleCode;
import com.drona.lms.domain.enums.UserStatus;
import com.drona.lms.domain.repository.RoleRepository;
import com.drona.lms.domain.repository.UserRepository;
import com.drona.lms.security.JwtService;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setStatus(UserStatus.ACTIVE);

        RoleCode targetRole = request.getRole() == null ? RoleCode.STUDENT : request.getRole();
        var role = roleRepository.findByCode(targetRole)
                .orElseThrow(() -> new IllegalStateException("Role not configured: " + targetRole));
        user.getRoles().add(role);

        User savedUser = userRepository.save(user);

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(savedUser.getEmail())
                .password(savedUser.getPasswordHash())
                .authorities(savedUser.getRoles().stream()
                        .map(r -> new SimpleGrantedAuthority("ROLE_" + r.getCode().name()))
                        .toList())
                .build();

        String accessToken = jwtService.generateToken(userDetails, Map.of(
                "roles", savedUser.getRoles().stream().map(r -> r.getCode().name()).toList()));

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .email(savedUser.getEmail())
                .roles(savedUser.getRoles().stream().map(r -> r.getCode().name()).collect(java.util.stream.Collectors.toSet()))
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        UserDetails principal = (UserDetails) authentication.getPrincipal();

        String accessToken = jwtService.generateToken(principal, Map.of(
                "roles", principal.getAuthorities().stream().map(a -> a.getAuthority()).toList()));

        Set<String> roles = principal.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(java.util.stream.Collectors.toSet());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .email(principal.getUsername())
                .roles(roles)
                .build();
    }
}
