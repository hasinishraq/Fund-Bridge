package com.fundbridge.walletservice.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RejectEncodedNewlineFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RejectEncodedNewlineFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String uri = request.getRequestURI();
        String query = request.getQueryString();
        String uriUpper = uri != null ? uri.toUpperCase() : "";
        String queryUpper = query != null ? query.toUpperCase() : "";
        if (uriUpper.contains("%0A") || uriUpper.contains("%0D") || queryUpper.contains("%0A") || queryUpper.contains("%0D")) {
            log.warn("Rejecting request with encoded newline: uri={}, method={}, remoteAddr={}",
                    uri, request.getMethod(), request.getRemoteAddr());
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"INVALID_URL\",\"message\":\"Invalid URL\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
