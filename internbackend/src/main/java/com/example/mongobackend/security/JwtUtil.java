package com.example.mongobackend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret:SwiftPlatformSecretKey2024!@#$%^&*()ABCDEF_MUST_BE_32_CHARS_MIN}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private long expiration;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(String employeeId, String role, String name, String email) {
        return Jwts.builder()
                .setSubject(employeeId)
                .claim("role",  role)
                .claim("name",  name)
                .claim("email", email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractEmployeeId(String token) { return extractClaims(token).getSubject(); }
    public String extractRole(String token)        { return extractClaims(token).get("role",  String.class); }
    public String extractName(String token)        { return extractClaims(token).get("name",  String.class); }
    public String extractEmail(String token)       { return extractClaims(token).get("email", String.class); }

    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}