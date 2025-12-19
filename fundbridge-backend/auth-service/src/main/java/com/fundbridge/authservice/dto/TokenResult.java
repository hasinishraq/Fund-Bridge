package com.fundbridge.authservice.dto;

import com.fundbridge.authservice.entity.UserAccount;

public record TokenResult(
        TokenPair tokens,
        UserAccount user
) {
}
