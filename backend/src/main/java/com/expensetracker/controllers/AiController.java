package com.expensetracker.controllers;

import com.expensetracker.dtos.AiChatRequest;
import com.expensetracker.dtos.AiChatResponse;
import com.expensetracker.services.GeminiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final GeminiService geminiService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> getChatReply(
            @Valid @RequestBody AiChatRequest request, 
            Principal principal) {
        log.info("AI chat request by user: {}", principal.getName());
        String reply = geminiService.getChatReply(principal.getName(), request.getMessage());
        return ResponseEntity.ok(new AiChatResponse(reply));
    }

    @GetMapping("/insights")
    public ResponseEntity<Map<String, String>> getInsights(Principal principal) {
        log.info("AI insights request by user: {}", principal.getName());
        String insights = geminiService.getFinancialInsights(principal.getName());
        Map<String, String> response = new HashMap<>();
        response.put("insights", insights);
        return ResponseEntity.ok(response);
    }
}
