package com.expensetracker.services;

import com.expensetracker.dtos.AccountRequest;
import com.expensetracker.dtos.AccountResponse;
import com.expensetracker.entities.Account;
import com.expensetracker.entities.User;
import com.expensetracker.exceptions.ResourceNotFoundException;
import com.expensetracker.repositories.AccountRepository;
import com.expensetracker.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public List<AccountResponse> getAllAccounts(String email) {
        User user = getUserByEmail(email);
        return accountRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getAccountById(Long id, String email) {
        User user = getUserByEmail(email);
        Account account = accountRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + id));
        return mapToResponse(account);
    }

    @Override
    @Transactional
    public AccountResponse createAccount(AccountRequest request, String email, String ipAddress) {
        User user = getUserByEmail(email);
        Account account = Account.builder()
                .name(request.getName())
                .type(request.getType())
                .balance(request.getBalance())
                .currency(request.getCurrency())
                .user(user)
                .build();
        Account savedAccount = accountRepository.save(account);

        auditLogService.log(user, "CREATE_ACCOUNT", 
                String.format("Created account: %s (Type: %s, Balance: %s)", account.getName(), account.getType(), account.getBalance()), 
                ipAddress);

        return mapToResponse(savedAccount);
    }

    @Override
    @Transactional
    public AccountResponse updateAccount(Long id, AccountRequest request, String email, String ipAddress) {
        User user = getUserByEmail(email);
        Account account = accountRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + id));

        account.setName(request.getName());
        account.setType(request.getType());
        account.setBalance(request.getBalance());
        account.setCurrency(request.getCurrency());

        Account updatedAccount = accountRepository.save(account);

        auditLogService.log(user, "UPDATE_ACCOUNT", 
                String.format("Updated account ID %d: %s (Type: %s, Balance: %s)", id, account.getName(), account.getType(), account.getBalance()), 
                ipAddress);

        return mapToResponse(updatedAccount);
    }

    @Override
    @Transactional
    public void deleteAccount(Long id, String email, String ipAddress) {
        User user = getUserByEmail(email);
        Account account = accountRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + id));

        accountRepository.delete(account);

        auditLogService.log(user, "DELETE_ACCOUNT", 
                String.format("Deleted account ID %d: %s", id, account.getName()), 
                ipAddress);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private AccountResponse mapToResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .name(account.getName())
                .type(account.getType())
                .balance(account.getBalance())
                .currency(account.getCurrency())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }
}
