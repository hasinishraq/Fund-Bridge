package com.fundbridge.notificationservice.repository;

import com.fundbridge.notificationservice.entity.NotificationChannel;
import com.fundbridge.notificationservice.entity.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, Long> {

    Optional<NotificationTemplate> findFirstByTemplateKeyAndChannelAndActiveTrueOrderByVersionDesc(String templateKey,
                                                                                                   NotificationChannel channel);

    boolean existsByTemplateKeyAndChannelAndActiveTrue(String templateKey, NotificationChannel channel);

    boolean existsByTemplateKeyAndChannelAndVersion(String templateKey, NotificationChannel channel, int version);

    @Query("select max(t.version) from NotificationTemplate t where t.templateKey = :templateKey and t.channel = :channel")
    Integer findMaxVersion(@Param("templateKey") String templateKey,
                           @Param("channel") NotificationChannel channel);

    @Modifying
    @Query("update NotificationTemplate t set t.active = false where t.templateKey = :templateKey and t.channel = :channel and t.id <> :id")
    int deactivateOtherVersions(@Param("templateKey") String templateKey,
                                @Param("channel") NotificationChannel channel,
                                @Param("id") Long id);
}
