package com.expensetracker.services;

import com.expensetracker.entities.AuditLog;
import com.expensetracker.entities.User;
import com.expensetracker.repositories.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public void log(User user, String action, String details, String ipAddress) {
        log.debug("Creating audit log - Action: {}, User: {}, IP: {}", action, user != null ? user.getEmail() : "Anonymous", ipAddress);
        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action(action)
                .details(details)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(auditLog);
    }
}
