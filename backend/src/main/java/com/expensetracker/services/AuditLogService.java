package com.expensetracker.services;

import com.expensetracker.entities.User;

public interface AuditLogService {
    void log(User user, String action, String details, String ipAddress);
}
