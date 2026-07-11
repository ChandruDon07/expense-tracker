package com.expensetracker.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.expensetracker.entities.*;
import com.expensetracker.exceptions.ResourceNotFoundException;
import com.expensetracker.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiServiceImpl implements GeminiService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.gemini.key:mock}")
    private String geminiKey;

    @Value("${app.gemini.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent}")
    private String geminiUrl;

    @Override
    public String getChatReply(String email, String message) {
        User user = getUserByEmail(email);
        String context = buildFinancialContext(user);
        
        String prompt = String.format(
                "You are an advanced personal finance assistant. Keep your responses friendly, concise, and professional. " +
                "Do not give risky investment advice. Use markdown for lists or bold text when highlighting numbers. " +
                "Answer the user's query using their financial context below.\n\n" +
                "=== USER FINANCIAL CONTEXT ===\n%s\n" +
                "=== USER QUERY ===\n%s\n\n" +
                "Response:",
                context, message
        );

        return callGemini(prompt, user);
    }

    @Override
    public String getFinancialInsights(String email) {
        User user = getUserByEmail(email);
        String context = buildFinancialContext(user);

        String prompt = String.format(
                "Analyze the user's financial profile below and generate exactly 3-4 bullet-point actionable insights. " +
                "Highlight spending categories that might need attention, savings recommendations, and budget progress. " +
                "Keep the response brief, formatted in markdown.\n\n" +
                "=== USER FINANCIAL CONTEXT ===\n%s\n\n" +
                "Actionable Insights:",
                context
        );

        return callGemini(prompt, user);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private String buildFinancialContext(User user) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("User: %s %s, Preferred Currency: %s\n", user.getFirstName(), user.getLastName(), user.getPreferredCurrency()));
        
        // Accounts
        sb.append("\nAccounts:\n");
        List<Account> accounts = accountRepository.findByUserId(user.getId());
        if (accounts.isEmpty()) {
            sb.append("- No accounts set up yet.\n");
        } else {
            for (Account acc : accounts) {
                sb.append(String.format("- %s (%s): %s %s\n", acc.getName(), acc.getType(), acc.getBalance(), acc.getCurrency()));
            }
        }

        // Budgets
        sb.append("\nBudgets (Active):\n");
        List<Budget> budgets = budgetRepository.findByUserId(user.getId());
        if (budgets.isEmpty()) {
            sb.append("- No budgets set up yet.\n");
        } else {
            for (Budget b : budgets) {
                Double spend = 0.0;
                String catName = "Global Overall Wallet";
                if (b.getCategory() != null) {
                    catName = b.getCategory().getName();
                    spend = transactionRepository.sumExpensesByCategoryIdAndDateRange(user.getId(), b.getCategory().getId(), b.getStartDate(), b.getEndDate());
                } else {
                    spend = transactionRepository.sumAmountByUserIdAndTypeAndDateRange(user.getId(), "EXPENSE", b.getStartDate(), b.getEndDate());
                }
                sb.append(String.format("- Limit for %s: %s, Current Spend: %s (Period: %s to %s)\n", catName, b.getLimitAmount(), spend, b.getStartDate(), b.getEndDate()));
            }
        }

        // Transactions (Recent)
        sb.append("\nRecent Transactions (Last 10):\n");
        List<Transaction> txs = transactionRepository.findByUserIdOrderByTransactionDateDesc(user.getId());
        if (txs.isEmpty()) {
            sb.append("- No transactions recorded.\n");
        } else {
            int count = Math.min(txs.size(), 10);
            for (int i = 0; i < count; i++) {
                Transaction t = txs.get(i);
                String cat = t.getCategory() != null ? t.getCategory().getName() : "None/Transfer";
                sb.append(String.format("- Date: %s | Amount: %s | Type: %s | Category: %s | Account: %s | Desc: %s\n",
                        t.getTransactionDate(), t.getAmount(), t.getType(), cat, t.getAccount().getName(), t.getDescription()));
            }
        }

        return sb.toString();
    }

    private String callGemini(String prompt, User user) {
        if (geminiKey == null || geminiKey.trim().isEmpty() || "mock".equalsIgnoreCase(geminiKey)) {
            return getFallbackResponse(user);
        }

        try {
            String url = geminiUrl + "?key=" + geminiKey;
            
            // Build Gemini Request Payload
            ObjectNode root = objectMapper.createObjectNode();
            ArrayNode contents = root.putArray("contents");
            ObjectNode partObj = contents.addObject();
            ArrayNode parts = partObj.putArray("parts");
            parts.addObject().put("text", prompt);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(root), headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode resNode = objectMapper.readTree(response.getBody());
                String reply = resNode.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText();
                if (!reply.trim().isEmpty()) {
                    return reply;
                }
            }
        } catch (Exception e) {
            log.error("Failed to connect to Gemini API. Falling back to rule-based response. Error: {}", e.getMessage());
        }

        return getFallbackResponse(user);
    }

    private String getFallbackResponse(User user) {
        List<Account> accounts = accountRepository.findByUserId(user.getId());
        double totalBalance = accounts.stream().mapToDouble(Account::getBalance).sum();

        return String.format(
                "### Financial Insights & Tips\n" +
                "- **Total Assets**: Your net worth across %d account(s) is **%s %.2f**.\n" +
                "- **Savings Plan**: Set up more specific category budgets (like Dining or Utilities) to keep expenses in check.\n" +
                "- **AI Note**: Live AI response is currently offline (mock mode). Please configure a valid `GEMINI_API_KEY` in `.env` to unlock live financial advisory and parsing capabilities.",
                accounts.size(), user.getPreferredCurrency(), totalBalance
        );
    }
}
