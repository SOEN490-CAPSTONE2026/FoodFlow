package com.example.foodflow.security;

import com.example.foodflow.config.JwtConfig;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;  // ADD THIS IMPORT
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Optional;

import com.example.foodflow.repository.UserRepository;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JwtAuthenticationFilterTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private JwtConfig jwtConfig;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        // Mock the JwtConfig to return test values
        when(jwtConfig.getSecret()).thenReturn("testSecretKeyThatIsAtLeast32CharactersLongForTesting");
        when(jwtConfig.getExpiration()).thenReturn(86400000L); // 24 hours
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void filter_success() throws Exception {
        // Given
        String email = "test@example.com";
        String role = "DONOR";
        String token = "valid-token";

        // When
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        request.addHeader("Authorization", "Bearer " + token);

        // Then
        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.getEmailFromToken(token)).thenReturn(email);
        when(jwtTokenProvider.getRoleFromToken(token)).thenReturn(role);

        com.example.foodflow.model.entity.User entityUser = new com.example.foodflow.model.entity.User();
        entityUser.setEmail(email);
        entityUser.setPassword("password123"); // dummy password

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(entityUser));

        jwtAuthenticationFilter.doFilterInternal(request, response, new FilterChain() {
            @Override
            public void doFilter(ServletRequest req, ServletResponse res) {
                // empty for test
            }
        });

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(entityUser, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        assertTrue(SecurityContextHolder.getContext().getAuthentication().isAuthenticated());
    }

    @Test
    void filter_invalidToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        String token = "invalid-token";
        request.addHeader("Authorization", "Bearer " + token);

        when(jwtTokenProvider.validateToken(token)).thenReturn(false);

        SecurityContextHolder.clearContext();

        jwtAuthenticationFilter.doFilterInternal(request, response, new FilterChain() {
            @Override
            public void doFilter(ServletRequest req, ServletResponse res) {
                // empty
            }
        });

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void filter_noToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtAuthenticationFilter.doFilterInternal(request, response, new FilterChain() {
            @Override
            public void doFilter(ServletRequest req, ServletResponse res) {
                // empty
            }
        });

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

}