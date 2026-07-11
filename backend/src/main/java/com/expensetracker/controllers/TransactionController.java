package com.expensetracker.controllers;

import com.expensetracker.dtos.TransactionRequest;
import com.expensetracker.dtos.TransactionResponse;
import com.expensetracker.services.TransactionService;
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
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getAllTransactions(Principal principal) {
        log.info("Fetching transactions for user: {}", principal.getName());
        return ResponseEntity.ok(transactionService.getAllTransactions(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponse> getTransactionById(@PathVariable Long id, Principal principal) {
        log.info("Fetching transaction ID {} for user: {}", id, principal.getName());
        return ResponseEntity.ok(transactionService.getTransactionById(id, principal.getName()));
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
            @Valid @RequestBody TransactionRequest request, 
            Principal principal, 
            HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        log.info("Creating transaction: type={}, amount={} for user: {} from IP: {}", 
                request.getType(), request.getAmount(), principal.getName(), ipAddress);
        TransactionResponse response = transactionService.createTransaction(request, principal.getName(), ipAddress);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> updateTransaction(
            @PathVariable Long id, 
            @Valid @RequestBody TransactionRequest request, 
            Principal principal, 
            HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        log.info("Updating transaction ID {} for user: {} from IP: {}", id, principal.getName(), ipAddress);
        TransactionResponse response = transactionService.updateTransaction(id, request, principal.getName(), ipAddress);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long id, 
            Principal principal, 
            HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        log.info("Deleting transaction ID {} for user: {} from IP: {}", id, principal.getName(), ipAddress);
        transactionService.deleteTransaction(id, principal.getName(), ipAddress);
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
