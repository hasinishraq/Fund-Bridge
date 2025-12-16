package com.fundbridge.loanmanagementservice.service;

import com.fundbridge.loanmanagementservice.dto.LoanEventResponse;
import com.fundbridge.loanmanagementservice.entity.Loan;
import com.fundbridge.loanmanagementservice.entity.LoanEvent;
import com.fundbridge.loanmanagementservice.entity.LoanEventType;
import com.fundbridge.loanmanagementservice.repository.LoanEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LoanEventService {

    private final LoanEventRepository loanEventRepository;

    public LoanEventService(LoanEventRepository loanEventRepository) {
        this.loanEventRepository = loanEventRepository;
    }

    @Transactional
    public void record(Loan loan, LoanEventType eventType, Long actorUserId, String details) {
        LoanEvent event = new LoanEvent();
        event.setLoan(loan);
        event.setEventType(eventType);
        event.setActorUserId(actorUserId);
        event.setDetails(details);
        loanEventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public List<LoanEventResponse> listForLoan(Long loanId) {
        return loanEventRepository.findByLoan_IdOrderByCreatedAtAsc(loanId)
                .stream()
                .map(event -> new LoanEventResponse(
                        event.getId(),
                        event.getEventType() != null ? event.getEventType().name() : null,
                        event.getActorUserId(),
                        event.getDetails(),
                        event.getCreatedAt()
                ))
                .toList();
    }
}
