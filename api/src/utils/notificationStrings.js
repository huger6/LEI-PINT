// Server-side notification translations (pt/en/es).
//
// These MIRROR the mobile app's source strings
// (mobile/lib/core/constants/source_strings*.dart) and are used to pre-translate
// PUSH notification text into the recipient's language, so the OS can render the
// notification reliably in every app state (foreground, background, terminated).
//
// Keep this in sync with the mobile dictionaries when notification copy changes.
// Templates use `{{token}}` placeholders interpolated from the notification meta.

const pt = {
    NOTIF_APP_SUBMITTED_TITLE: `Candidatura submetida`,
    NOTIF_APP_SUBMITTED_BODY: `A sua candidatura para o badge "{{badgeTitle}}" foi submetida com sucesso.`,
    NOTIF_APP_NEW_APPLICATION_TITLE: `Nova candidatura recebida`,
    NOTIF_APP_NEW_APPLICATION_BODY: `Uma nova candidatura para o badge "{{badgeTitle}}" aguarda revisão.`,
    NOTIF_APP_BADGE_AWARDED_TITLE: `Parabéns, conquistou um badge!`,
    NOTIF_APP_BADGE_AWARDED_BODY: `O badge "{{badgeTitle}}" foi-lhe atribuído com sucesso. Continue assim, cada badge é um passo rumo à excelência!`,
    NOTIF_APP_SPECIAL_BADGE_AWARDED_TITLE: `Badge especial conquistado!`,
    NOTIF_APP_SPECIAL_BADGE_AWARDED_BODY: `Incrível! Conquistou o badge especial "{{badgeTitle}}". Este é um feito notável — continue a superar-se!`,
    NOTIF_APP_REJECTED_TITLE: `Candidatura rejeitada`,
    NOTIF_APP_REJECTED_BODY: `A sua candidatura para o badge "{{badgeTitle}}" foi rejeitada.`,
    NOTIF_APP_RETURNED_TITLE: `Candidatura devolvida`,
    NOTIF_APP_RETURNED_BODY: `A sua candidatura para o badge "{{badgeTitle}}" foi devolvida para revisão. Verifique as notas do avaliador e volte a submeter.`,
    NOTIF_APP_IN_VALIDATION_TITLE: `Candidatura em validação`,
    NOTIF_APP_IN_VALIDATION_BODY: `A sua candidatura para o badge "{{badgeTitle}}" está agora em validação.`,
    NOTIF_APP_PENDING_SLL_REVIEW_TITLE: `Candidatura aguarda revisão`,
    NOTIF_APP_PENDING_SLL_REVIEW_BODY: `Uma candidatura para o badge "{{badgeTitle}}" aguarda a sua revisão.`,
    NOTIF_BADGE_EXPIRING_SOON_TITLE: `Badge a expirar em breve`,
    NOTIF_BADGE_EXPIRING_SOON_BODY: `O seu badge "{{badgeTitle}}" expira em {{daysRemaining}} dias.`,
    NOTIF_BADGE_EXPIRED_TITLE: `Badge expirado`,
    NOTIF_BADGE_EXPIRED_BODY: `O seu badge "{{badgeTitle}}" expirou.`,
    NOTIF_SLA_BREACH_TITLE: `Incumprimento de SLA`,
    NOTIF_SLA_BREACH_BODY: `O SLA "{{slaName}}" foi ultrapassado em {{hoursExceeded}}h para o badge "{{badgeTitle}}".`,
    NOTIF_CUSTOM_SLA_BREACH_TITLE: `Incumprimento de SLA personalizado`,
    NOTIF_CUSTOM_SLA_BREACH_BODY: `O SLA "{{slaName}}" atingiu o prazo limite.`,
    NOTIF_GOAL_REMINDER_TITLE: `Lembrete de objetivo`,
    NOTIF_GOAL_REMINDER_BODY: `Não se esqueça do seu objetivo "{{goalTitle}}".`,
    NOTIF_GOAL_DEADLINE_APPROACHING_TITLE: `Prazo de objetivo a aproximar-se`,
    NOTIF_GOAL_DEADLINE_APPROACHING_BODY: `O seu objetivo "{{goalTitle}}" termina em {{daysRemaining}} dias.`,
    NOTIF_REWARD_REDEEMED_TITLE: `Recompensa resgatada`,
    NOTIF_REWARD_REDEEMED_BODY: `Resgatou "{{rewardName}}" por {{points}} pontos.`
};

const en = {
    NOTIF_APP_SUBMITTED_TITLE: `Application submitted`,
    NOTIF_APP_SUBMITTED_BODY: `Your application for the badge "{{badgeTitle}}" was submitted successfully.`,
    NOTIF_APP_NEW_APPLICATION_TITLE: `New application received`,
    NOTIF_APP_NEW_APPLICATION_BODY: `A new application for the badge "{{badgeTitle}}" is awaiting review.`,
    NOTIF_APP_BADGE_AWARDED_TITLE: `Congratulations, you earned a badge!`,
    NOTIF_APP_BADGE_AWARDED_BODY: `The badge "{{badgeTitle}}" has been awarded to you. Keep it up, every badge brings you closer to excellence!`,
    NOTIF_APP_SPECIAL_BADGE_AWARDED_TITLE: `Special badge unlocked!`,
    NOTIF_APP_SPECIAL_BADGE_AWARDED_BODY: `Amazing! You earned the special badge "{{badgeTitle}}". This is a remarkable achievement — keep pushing forward!`,
    NOTIF_APP_REJECTED_TITLE: `Application rejected`,
    NOTIF_APP_REJECTED_BODY: `Your application for the badge "{{badgeTitle}}" has been rejected.`,
    NOTIF_APP_RETURNED_TITLE: `Application returned`,
    NOTIF_APP_RETURNED_BODY: `Your application for the badge "{{badgeTitle}}" was returned for review. Check the reviewer's notes and resubmit it.`,
    NOTIF_APP_IN_VALIDATION_TITLE: `Application in validation`,
    NOTIF_APP_IN_VALIDATION_BODY: `Your application for the badge "{{badgeTitle}}" is now being validated.`,
    NOTIF_APP_PENDING_SLL_REVIEW_TITLE: `Application awaiting review`,
    NOTIF_APP_PENDING_SLL_REVIEW_BODY: `An application for the badge "{{badgeTitle}}" is awaiting your review.`,
    NOTIF_BADGE_EXPIRING_SOON_TITLE: `Badge expiring soon`,
    NOTIF_BADGE_EXPIRING_SOON_BODY: `Your badge "{{badgeTitle}}" expires in {{daysRemaining}} days.`,
    NOTIF_BADGE_EXPIRED_TITLE: `Badge expired`,
    NOTIF_BADGE_EXPIRED_BODY: `Your badge "{{badgeTitle}}" has expired.`,
    NOTIF_SLA_BREACH_TITLE: `SLA breach`,
    NOTIF_SLA_BREACH_BODY: `The SLA "{{slaName}}" was exceeded by {{hoursExceeded}}h for the badge "{{badgeTitle}}".`,
    NOTIF_CUSTOM_SLA_BREACH_TITLE: `Custom SLA breach`,
    NOTIF_CUSTOM_SLA_BREACH_BODY: `The SLA "{{slaName}}" has reached its deadline.`,
    NOTIF_GOAL_REMINDER_TITLE: `Goal reminder`,
    NOTIF_GOAL_REMINDER_BODY: `Don't forget about your goal "{{goalTitle}}".`,
    NOTIF_GOAL_DEADLINE_APPROACHING_TITLE: `Goal deadline approaching`,
    NOTIF_GOAL_DEADLINE_APPROACHING_BODY: `Your goal "{{goalTitle}}" is due in {{daysRemaining}} days.`,
    NOTIF_REWARD_REDEEMED_TITLE: `Reward redeemed`,
    NOTIF_REWARD_REDEEMED_BODY: `You redeemed "{{rewardName}}" for {{points}} points.`
};

const es = {
    NOTIF_APP_SUBMITTED_TITLE: `Candidatura enviada`,
    NOTIF_APP_SUBMITTED_BODY: `Tu candidatura para el badge "{{badgeTitle}}" fue enviada con éxito.`,
    NOTIF_APP_NEW_APPLICATION_TITLE: `Nueva candidatura recibida`,
    NOTIF_APP_NEW_APPLICATION_BODY: `Una nueva candidatura para el badge "{{badgeTitle}}" está pendiente de revisión.`,
    NOTIF_APP_BADGE_AWARDED_TITLE: `¡Felicidades, conseguiste un badge!`,
    NOTIF_APP_BADGE_AWARDED_BODY: `El badge "{{badgeTitle}}" te ha sido otorgado. ¡Sigue así, cada badge te acerca más a la excelencia!`,
    NOTIF_APP_SPECIAL_BADGE_AWARDED_TITLE: `¡Badge especial desbloqueado!`,
    NOTIF_APP_SPECIAL_BADGE_AWARDED_BODY: `¡Increíble! Conseguiste el badge especial "{{badgeTitle}}". Es un logro notable — ¡sigue superándote!`,
    NOTIF_APP_REJECTED_TITLE: `Candidatura rechazada`,
    NOTIF_APP_REJECTED_BODY: `Tu candidatura para el badge "{{badgeTitle}}" ha sido rechazada.`,
    NOTIF_APP_RETURNED_TITLE: `Candidatura devuelta`,
    NOTIF_APP_RETURNED_BODY: `Tu candidatura para el badge "{{badgeTitle}}" ha sido devuelta para revisión. Revisa las notas del evaluador y vuelve a enviarla.`,
    NOTIF_APP_IN_VALIDATION_TITLE: `Candidatura en validación`,
    NOTIF_APP_IN_VALIDATION_BODY: `Tu candidatura para el badge "{{badgeTitle}}" está ahora en validación.`,
    NOTIF_APP_PENDING_SLL_REVIEW_TITLE: `Candidatura pendiente de revisión`,
    NOTIF_APP_PENDING_SLL_REVIEW_BODY: `Una candidatura para el badge "{{badgeTitle}}" está pendiente de tu revisión.`,
    NOTIF_BADGE_EXPIRING_SOON_TITLE: `Badge a punto de expirar`,
    NOTIF_BADGE_EXPIRING_SOON_BODY: `Tu badge "{{badgeTitle}}" expira en {{daysRemaining}} días.`,
    NOTIF_BADGE_EXPIRED_TITLE: `Badge expirado`,
    NOTIF_BADGE_EXPIRED_BODY: `Tu badge "{{badgeTitle}}" ha expirado.`,
    NOTIF_SLA_BREACH_TITLE: `Incumplimiento de SLA`,
    NOTIF_SLA_BREACH_BODY: `El SLA "{{slaName}}" fue superado en {{hoursExceeded}}h para el badge "{{badgeTitle}}".`,
    NOTIF_CUSTOM_SLA_BREACH_TITLE: `Incumplimiento de SLA personalizado`,
    NOTIF_CUSTOM_SLA_BREACH_BODY: `El SLA "{{slaName}}" ha alcanzado su plazo límite.`,
    NOTIF_GOAL_REMINDER_TITLE: `Recordatorio de objetivo`,
    NOTIF_GOAL_REMINDER_BODY: `No olvides tu objetivo "{{goalTitle}}".`,
    NOTIF_GOAL_DEADLINE_APPROACHING_TITLE: `Plazo de objetivo próximo`,
    NOTIF_GOAL_DEADLINE_APPROACHING_BODY: `Tu objetivo "{{goalTitle}}" vence en {{daysRemaining}} días.`,
    NOTIF_REWARD_REDEEMED_TITLE: `Recompensa canjeada`,
    NOTIF_REWARD_REDEEMED_BODY: `Canjeaste "{{rewardName}}" por {{points}} puntos.`
};

const DICTS = { pt, en, es };

// Map a DB language_iso (e.g. 'pt-PT', 'en-GB', 'es-ES') to a dictionary code.
// Defaults to Portuguese (the source language).
const isoToCode = (iso) => {
    const lower = String(iso || '').toLowerCase();
    if (lower.startsWith('en')) return 'en';
    if (lower.startsWith('es')) return 'es';
    return 'pt';
};

// Replace `{{token}}` placeholders with values from meta. Unknown tokens are
// left untouched (mirrors the mobile interpolation behaviour).
const interpolate = (template, meta = {}) =>
    template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
        meta && meta[key] != null ? String(meta[key]) : match
    );

// Translate + interpolate a notification's title/body keys for a given language.
// Falls back to the PT dictionary, then to the raw key, mirroring the mobile app.
const translateNotification = ({ titleKey, bodyKey, meta = {}, languageIso } = {}) => {
    const dict = DICTS[isoToCode(languageIso)] || pt;
    const tr = (key) => {
        if (!key) return '';
        const template = dict[key] || pt[key] || key;
        return interpolate(template, meta || {});
    };
    return { title: tr(titleKey), body: tr(bodyKey) };
};

module.exports = { translateNotification, isoToCode };
