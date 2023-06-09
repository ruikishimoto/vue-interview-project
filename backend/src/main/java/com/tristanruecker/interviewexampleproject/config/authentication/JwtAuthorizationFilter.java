package com.tristanruecker.interviewexampleproject.config.authentication;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tristanruecker.interviewexampleproject.utils.EnvironmentUtils;
import com.tristanruecker.interviewexampleproject.utils.JwtUtils;
import org.apache.logging.log4j.util.Strings;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * If JWT token is expired then it returns status code 401
 * If token is invalid status code 403 will be returned
 * If Authorization header is not visible status code 403 is returned by default
 */
public class JwtAuthorizationFilter extends BasicAuthenticationFilter {

    private final JwtUtils jwtUtils;
    private final ObjectMapper objectMapper;
    private final EnvironmentUtils environmentUtils;


    JwtAuthorizationFilter(AuthenticationManager authenticationManager,
                           ObjectMapper objectMapper,
                           JwtUtils jwtUtils, EnvironmentUtils environmentUtils) {
        super(authenticationManager);
        this.objectMapper = objectMapper;
        this.jwtUtils = jwtUtils;
        this.environmentUtils = environmentUtils;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws IOException, ServletException {

        String tokenHeader = request.getHeader("Authorization");
        boolean isAuthorizationHeaderAndTokenVisible = isAuthorizationHeaderAndTokenVisible(tokenHeader);
        if (!isAuthorizationHeaderAndTokenVisible) {
            filterChain.doFilter(request, response);
            return;
        }

        if (request.getRequestURI().equals(environmentUtils.getSecurityBaseUrl() + "/renewToken")) {
            filterChain.doFilter(request, response);
            return;
        }

        JWTParseResultObject jwtParseResultObject = jwtUtils.parseAuthentication(tokenHeader);

        switch (jwtParseResultObject.getJwtParseResult()) {
            case SUCCESS:
                SecurityContextHolder.getContext().setAuthentication(jwtParseResultObject.getUsernamePasswordAuthenticationToken());
                break;
            case EXPIRED:
                UnauthorizedException unauthorizedException = new UnauthorizedException(HttpStatus.UNAUTHORIZED, "Access denied.");
                String unauthorizedResponse = objectMapper.writeValueAsString(unauthorizedException);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write(unauthorizedResponse);
                response.getWriter().flush();
                response.getWriter().close();
                break;
            case FAILED:
                break;
        }

        try {
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            logger.debug(e.getCause().getMessage() + ". StatusCode: " + response.getStatus() + " Address that is trying to access resource: " + request.getRemoteAddr());
        }
    }


    private boolean isAuthorizationHeaderAndTokenVisible(String authorizationHeader) {
        return Strings.isNotEmpty(authorizationHeader) && authorizationHeader.startsWith("Bearer ");
    }
}
