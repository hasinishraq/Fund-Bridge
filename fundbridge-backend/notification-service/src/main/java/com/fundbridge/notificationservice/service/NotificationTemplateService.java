package com.fundbridge.notificationservice.service;

import com.fundbridge.notificationservice.dto.CreateNotificationTemplateRequest;
import com.fundbridge.notificationservice.dto.NotificationTemplateResponse;
import com.fundbridge.notificationservice.entity.NotificationChannel;
import com.fundbridge.notificationservice.entity.NotificationTemplate;
import com.fundbridge.notificationservice.exception.ResourceConflictException;
import com.fundbridge.notificationservice.exception.ResourceNotFoundException;
import com.fundbridge.notificationservice.mapper.NotificationMapper;
import com.fundbridge.notificationservice.repository.NotificationTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class NotificationTemplateService {

    private final NotificationTemplateRepository templateRepository;

    public NotificationTemplateService(NotificationTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    public List<NotificationTemplateResponse> listTemplates(String templateKey,
                                                            NotificationChannel channel,
                                                            Boolean active) {
        List<NotificationTemplate> templates = templateRepository.findAll();
        return templates.stream()
                .filter(template -> templateKey == null
                        || template.getTemplateKey().equalsIgnoreCase(templateKey))
                .filter(template -> channel == null || template.getChannel() == channel)
                .filter(template -> active == null || template.isActive() == active)
                .sorted(Comparator.comparing(NotificationTemplate::getTemplateKey)
                        .thenComparing(NotificationTemplate::getChannel)
                        .thenComparing(NotificationTemplate::getVersion, Comparator.reverseOrder()))
                .map(NotificationMapper::toTemplateResponse)
                .toList();
    }

    @Transactional
    public NotificationTemplateResponse createTemplate(CreateNotificationTemplateRequest request) {
        String normalizedKey = request.templateKey().trim();
        NotificationChannel channel = request.channel();
        int version = resolveVersion(normalizedKey, channel, request.version());
        if (templateRepository.existsByTemplateKeyAndChannelAndVersion(normalizedKey, channel, version)) {
            throw new ResourceConflictException("Template version already exists");
        }

        NotificationTemplate template = new NotificationTemplate();
        template.setTemplateKey(normalizedKey);
        template.setChannel(channel);
        template.setSubject(normalizeSubject(request.subject()));
        template.setBody(request.body());
        template.setVersion(version);

        boolean active = request.active() == null || request.active();
        template.setActive(active);

        NotificationTemplate saved = templateRepository.save(template);
        if (active) {
            templateRepository.deactivateOtherVersions(normalizedKey, channel, saved.getId());
        }
        return NotificationMapper.toTemplateResponse(saved);
    }

    @Transactional
    public NotificationTemplateResponse updateTemplateStatus(Long id, boolean active) {
        NotificationTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
        template.setActive(active);
        if (active) {
            templateRepository.deactivateOtherVersions(template.getTemplateKey(), template.getChannel(), template.getId());
        }
        return NotificationMapper.toTemplateResponse(template);
    }

    @Transactional(readOnly = true, noRollbackFor = ResourceNotFoundException.class)
    public NotificationTemplate getActiveTemplate(String templateKey, NotificationChannel channel) {
        String normalizedKey = templateKey == null ? null : templateKey.trim();
        return templateRepository.findFirstByTemplateKeyAndChannelAndActiveTrueOrderByVersionDesc(normalizedKey, channel)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Active template not found for key=" + normalizedKey + " channel=" + channel));
    }

    private int resolveVersion(String templateKey, NotificationChannel channel, Integer requestedVersion) {
        if (requestedVersion != null) {
            return requestedVersion;
        }
        Integer maxVersion = templateRepository.findMaxVersion(templateKey, channel);
        return maxVersion == null ? 1 : maxVersion + 1;
    }

    private String normalizeSubject(String subject) {
        if (subject == null) {
            return null;
        }
        String trimmed = subject.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
