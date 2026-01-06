package com.fundbridge.walletservice.service;

import com.fundbridge.walletservice.entity.WalletAccount;
import com.fundbridge.walletservice.entity.WalletBalance;
import com.fundbridge.walletservice.entity.WalletHold;
import com.fundbridge.walletservice.entity.WalletTransaction;
import com.fundbridge.walletservice.integration.notification.NotificationClient;
import com.fundbridge.walletservice.integration.notification.NotificationDispatchRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class WalletNotificationService {

    private static final List<String> DEFAULT_CHANNELS = List.of("EMAIL", "INAPP");

    static final String TEMPLATE_TOPUP_SUCCESS = "WALLET_TOPUP_SUCCESS";
    static final String TEMPLATE_TOPUP_FAILED = "WALLET_TOPUP_FAILED";
    static final String TEMPLATE_TRANSFER_SENT = "WALLET_TRANSFER_SENT";
    static final String TEMPLATE_TRANSFER_RECEIVED = "WALLET_TRANSFER_RECEIVED";
    static final String TEMPLATE_HOLD_CREATED = "WALLET_HOLD_CREATED";
    static final String TEMPLATE_HOLD_RELEASED = "WALLET_HOLD_RELEASED";
    static final String TEMPLATE_HOLD_CAPTURED = "WALLET_HOLD_CAPTURED";

    private final NotificationClient notificationClient;

    public WalletNotificationService(NotificationClient notificationClient) {
        this.notificationClient = notificationClient;
    }

    public void notifyTopUpSuccess(WalletService.FundingResult result) {
        if (result == null || result.account() == null) {
            return;
        }
        WalletAccount account = result.account();
        WalletBalance balance = result.balance();
        WalletTransaction transaction = result.transaction();
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", account.getUserId());
        payload.put("accountId", account.getId());
        payload.put("amount", transaction != null ? transaction.getAmount() : null);
        payload.put("currency", account.getCurrency());
        payload.put("txRef", transaction != null ? transaction.getTxRef() : null);
        payload.put("availableBalance", balance != null ? balance.getAvailable() : null);
        payload.put("heldBalance", balance != null ? balance.getHeld() : null);
        payload.put("referenceType", transaction != null ? transaction.getReferenceType() : null);
        payload.put("referenceId", transaction != null ? transaction.getReferenceId() : null);
        String txRef = transaction != null ? transaction.getTxRef() : null;
        dispatch(account.getUserId(), TEMPLATE_TOPUP_SUCCESS, payload,
                txRef != null ? "wallet:topup:" + txRef : null);
    }

    public void notifyTopUpFailure(Long userId,
                                   BigDecimal amount,
                                   String currency,
                                   String provider,
                                   String intentId,
                                   String reason) {
        if (userId == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", userId);
        payload.put("amount", amount);
        payload.put("currency", currency);
        payload.put("provider", provider);
        payload.put("intentId", intentId);
        payload.put("reason", reason);
        String base = provider != null ? provider.toLowerCase() : "unknown";
        String idempotency = intentId != null ? "wallet:topup:failed:" + base + ":" + intentId : null;
        dispatch(userId, TEMPLATE_TOPUP_FAILED, payload, idempotency);
    }

    public void notifyTransfer(WalletTransaction transaction, Long fromUserId, Long toUserId) {
        if (transaction == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("amount", transaction.getAmount());
        payload.put("currency", transaction.getCurrency());
        payload.put("txRef", transaction.getTxRef());
        payload.put("fromAccountId", transaction.getFromAccount() != null ? transaction.getFromAccount().getId() : null);
        payload.put("toAccountId", transaction.getToAccount() != null ? transaction.getToAccount().getId() : null);
        payload.put("referenceType", transaction.getReferenceType());
        payload.put("referenceId", transaction.getReferenceId());
        String txRef = transaction.getTxRef();
        if (fromUserId != null) {
            dispatch(fromUserId, TEMPLATE_TRANSFER_SENT, payload,
                    txRef != null ? "wallet:transfer:" + txRef + ":sent" : null);
        }
        if (toUserId != null) {
            dispatch(toUserId, TEMPLATE_TRANSFER_RECEIVED, payload,
                    txRef != null ? "wallet:transfer:" + txRef + ":received" : null);
        }
    }

    public void notifyHoldCreated(WalletHold hold) {
        if (hold == null || hold.getAccount() == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("holdRef", hold.getHoldRef());
        payload.put("amount", hold.getAmount());
        payload.put("currency", hold.getCurrency());
        payload.put("reason", hold.getReason());
        payload.put("referenceType", hold.getReferenceType());
        payload.put("referenceId", hold.getReferenceId());
        dispatch(hold.getAccount().getUserId(), TEMPLATE_HOLD_CREATED, payload,
                hold.getHoldRef() != null ? "wallet:hold:" + hold.getHoldRef() + ":created" : null);
    }

    public void notifyHoldReleased(WalletHold hold) {
        if (hold == null || hold.getAccount() == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("holdRef", hold.getHoldRef());
        payload.put("amount", hold.getAmount());
        payload.put("currency", hold.getCurrency());
        payload.put("reason", hold.getReason());
        payload.put("referenceType", hold.getReferenceType());
        payload.put("referenceId", hold.getReferenceId());
        dispatch(hold.getAccount().getUserId(), TEMPLATE_HOLD_RELEASED, payload,
                hold.getHoldRef() != null ? "wallet:hold:" + hold.getHoldRef() + ":released" : null);
    }

    public void notifyHoldCaptured(WalletHold hold, WalletTransaction transaction) {
        if (hold == null || hold.getAccount() == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("holdRef", hold.getHoldRef());
        payload.put("amount", hold.getAmount());
        payload.put("currency", hold.getCurrency());
        payload.put("reason", hold.getReason());
        payload.put("referenceType", hold.getReferenceType());
        payload.put("referenceId", hold.getReferenceId());
        payload.put("txRef", transaction != null ? transaction.getTxRef() : null);
        dispatch(hold.getAccount().getUserId(), TEMPLATE_HOLD_CAPTURED, payload,
                hold.getHoldRef() != null ? "wallet:hold:" + hold.getHoldRef() + ":captured" : null);
    }

    private void dispatch(Long userId, String templateKey, Map<String, Object> payload, String idempotencyKey) {
        if (userId == null) {
            return;
        }
        notificationClient.dispatch(new NotificationDispatchRequest(
                userId,
                templateKey,
                payload,
                DEFAULT_CHANNELS,
                null,
                idempotencyKey
        ));
    }
}
