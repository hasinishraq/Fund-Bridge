package com.fundbridge.adminservice.service;

import com.fundbridge.adminservice.dto.AdminKpiSnapshotResponse;
import com.fundbridge.adminservice.dto.CreateAdminKpiSnapshotRequest;
import com.fundbridge.adminservice.entity.AdminKpiSnapshot;
import com.fundbridge.adminservice.exception.ResourceNotFoundException;
import com.fundbridge.adminservice.repository.AdminKpiSnapshotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AdminKpiService {

    private final AdminKpiSnapshotRepository snapshotRepository;

    public AdminKpiService(AdminKpiSnapshotRepository snapshotRepository) {
        this.snapshotRepository = snapshotRepository;
    }

    @Transactional
    public AdminKpiSnapshotResponse createSnapshot(CreateAdminKpiSnapshotRequest request) {
        AdminKpiSnapshot snapshot = new AdminKpiSnapshot();
        snapshot.setTotalOutstandingLoans(request.totalOutstandingLoans());
        snapshot.setTodaysDisbursements(request.todaysDisbursements());
        snapshot.setDueTodayAmount(request.dueTodayAmount());
        snapshot.setOverdueAmount(request.overdueAmount());
        snapshot.setDefaultRate30d(request.defaultRate30d());
        snapshot.setWalletInflowToday(request.walletInflowToday());
        snapshot.setWalletOutflowToday(request.walletOutflowToday());
        snapshot.setFailedPaymentsCount(request.failedPaymentsCount());
        snapshot.setWebhookFailuresCount(request.webhookFailuresCount());
        snapshot.setSuspiciousActivityFlags(request.suspiciousActivityFlags());
        AdminKpiSnapshot saved = snapshotRepository.save(snapshot);
        return toResponse(saved);
    }

    public List<AdminKpiSnapshotResponse> listSnapshots() {
        return snapshotRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public AdminKpiSnapshotResponse getLatestSnapshot() {
        AdminKpiSnapshot snapshot = snapshotRepository.findTopByOrderByCreatedAtDesc()
                .orElseThrow(() -> new ResourceNotFoundException("No KPI snapshot available"));
        return toResponse(snapshot);
    }

    private AdminKpiSnapshotResponse toResponse(AdminKpiSnapshot snapshot) {
        return new AdminKpiSnapshotResponse(
                snapshot.getId(),
                snapshot.getTotalOutstandingLoans(),
                snapshot.getTodaysDisbursements(),
                snapshot.getDueTodayAmount(),
                snapshot.getOverdueAmount(),
                snapshot.getDefaultRate30d(),
                snapshot.getWalletInflowToday(),
                snapshot.getWalletOutflowToday(),
                snapshot.getFailedPaymentsCount(),
                snapshot.getWebhookFailuresCount(),
                snapshot.getSuspiciousActivityFlags(),
                snapshot.getCreatedAt()
        );
    }
}
