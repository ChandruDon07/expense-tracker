package com.expensetracker.controllers;

import com.expensetracker.dtos.AccountRequest;
import com.expensetracker.dtos.AccountResponse;
import com.expensetracker.services.AccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Slf4j
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<List<AccountResponse>> getAllAccounts(Principal principal) {
        log.info("Fetching all accounts for user: {}", principal.getName());
        return ResponseEntity.ok(accountService.getAllAccounts(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> getAccountById(@PathVariable Long id, Principal principal) {
        log.info("Fetching account ID {} for user: {}", id, principal.getName());
        return ResponseEntity.ok(accountService.getAccountById(id, principal.getName()));
    }

    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(
            @Valid @RequestBody AccountRequest request, 
            Principal principal, 
            HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        log.info("Creating account: {} for user: {} from IP: {}", request.getName(), principal.getName(), ipAddress);
        AccountResponse response = accountService.createAccount(request, principal.getName(), ipAddress);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountResponse> updateAccount(
            @PathVariable Long id, 
            @Valid @RequestBody AccountRequest request, 
            Principal principal, 
            HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        log.info("Updating account ID {} for user: {} from IP: {}", id, principal.getName(), ipAddress);
        AccountResponse response = accountService.updateAccount(id, request, principal.getName(), ipAddress);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(
            @PathVariable Long id, 
            Principal principal, 
            HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        log.info("Deleting account ID {} for user: {} from IP: {}", id, principal.getName(), ipAddress);
        accountService.deleteAccount(id, principal.getName(), ipAddress);
        return ResponseEntity.noContent().build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
