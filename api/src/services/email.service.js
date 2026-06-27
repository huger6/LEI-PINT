const nodemailer = require('nodemailer');
const loadEnvironment = require('../config/loadEnv');
const { logger } = require('../utils/logger');

const logoUrl = process.env.LOGO_URL;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sendConfirmationEmail = async (email, name, token, lang) => {
    const confirmationUrl = `${process.env.FRONTEND_EMAIL_CONFIRMATION_URL}?token=${token}`; // CHANGE TO FRONTEND LINK

    const templates = {
        'pt-PT': {
            subject: 'Confirmação de Registo - Plataforma de Badges da Softinsa',
            welcome: 'Bem-vindo(a) à Plataforma de Badges da Softinsa, {name}',
            thanks: 'Obrigado por te registares na Plataforma de Badges da Softinsa.',
            intro: 'Para completares a configuração da tua conta, por favor verifica o teu endereço de e-mail clicando no botão abaixo:',
            buttonLabel: 'Verificar E-mail',
            fallbackText: 'Não consegues clicar no botão acima? Copia e cola este link no teu navegador:',
            expiry: 'Este link é válido por 8 horas. Verifica o teu e-mail hoje para começares a usar a plataforma.',
            note: 'Se não criaste uma conta recentemente, podes ignorar este e-mail. No primeiro acesso, terás de alterar a tua password.',
            team: 'A Equipa Softinsa'
        },
        'en-GB': {
            subject: 'Registration Confirmation - Softinsa Badges Platform',
            welcome: 'Welcome to Softinsa Badges Platform, {name}',
            thanks: 'Thanks for signing up for Softinsa Badges Platform.',
            intro: 'To complete your account setup, please verify your email address by clicking the button below:',
            buttonLabel: 'Verify Email Address',
            fallbackText: "Can't click the button above? Copy and paste this link into your browser:",
            expiry: 'This link is valid for 8 hours. Verify your email address today to start using the platform.',
            note: 'If you did not recently create an account, you can ignore this email. On your first login, you will need to change your password.',
            team: 'The Softinsa Team'
        },
        'es-ES': {
            subject: 'Confirmación de Registro - Plataforma de Insignias de Softinsa',
            welcome: 'Bienvenido/a a la Plataforma de Insignias de Softinsa, {name}',
            thanks: 'Gracias por registrarte en Plataforma de Insignias de Softinsa.',
            intro: 'Para completar la configuración de tu cuenta, por favor verifica tu dirección de correo haciendo clic en el botón de abajo:',
            buttonLabel: 'Verificar Correo',
            fallbackText: '¿No puedes hacer clic en el botón? Copia y pega este enlace en tu navegador:',
            expiry: 'Este enlace es válido por 8 horas. Verifica tu correo hoy para empezar a usar la plataforma.',
            note: 'Si no has creado una cuenta recientemente, puedes ignorar este correo. En tu primer acceso, deberás cambiar tu contraseña.',
            team: 'El Equipo de Softinsa'
        }
    };

    const t = templates[lang] || templates['pt-PT'];
    const safeName = escapeHtml(name);
    const welcomeMessage = t.welcome.replace('{name}', safeName);

    const uniqueId = Date.now().toString(36); // So email doesn't auto-hide footer

    const mailOptions = {
        from: `"Softinsa" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: t.subject,
        html: `
            <div style="background-color: #f9f9f9; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: left;">
                            <img src="${logoUrl}" alt="Softinsa" width="150" style="display: block; border: 0;">
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 40px 20px 40px;">
                            <p style="font-size: 18px; font-weight: 700; line-height: 26px; margin-bottom: 12px;">
                                ${welcomeMessage}
                            </p>
                            <p style="font-size: 16px; line-height: 24px; margin-bottom: 20px;">
                                ${t.thanks} ${t.intro}
                            </p>
                            
                            <div style="text-align: center; padding: 20px 0;">
                                <a href="${confirmationUrl}" style="background: linear-gradient(90deg, #39639C 0%, #00B8E0 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 50px; display: inline-block;">
                                    ${t.buttonLabel}
                                </a>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="background-color: #f0f7ff; padding: 20px; border-radius: 4px; text-align: center;">
                                <p style="font-size: 13px; margin: 0 0 10px 0; color: #666666;">${t.fallbackText}</p>
                                <a href="${confirmationUrl}" style="color: #0062ff; font-size: 12px; word-break: break-all; text-decoration: underline;">
                                    ${confirmationUrl}
                                </a>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 30px 40px 40px 40px; font-size: 14px; line-height: 22px; color: #555555;">
                            <p style="margin-bottom: 15px;">${t.expiry}</p>
                            <p style="margin-bottom: 25px;">${t.note}</p>
                            <p style="margin-bottom: 0;">— ${t.team}</p>
                        </td>
                    </tr>
                </table>

                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
                    <tr>
                        <td style="padding: 20px 0; text-align: center; font-size: 12px; color: #999999; line-height: 18px;">
                            &copy; ${new Date().getFullYear()} Softinsa. <br>
                            Edifício Office Oriente, Rua do Mar da China nº3 - B6, Parque das Nações, 1990-138 Lisboa
                        </td>
                    </tr>
                </table>
                <div style="display: none; max-height: 0px; overflow: hidden;">
                    ID: ${uniqueId}
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        logger.error("Error sending email:", error);
        return { success: false, error };
    }
};

const sendResetPasswordEmail = async (email, name, token, lang) => {
    const resetUrl = `${process.env.FRONTEND_RESET_PASSWORD_URL}?token=${token}`; // CHANGE TO FRONTEND LINK

    const templates = {
        'pt-PT': {
            subject: 'Recuperação de Password - Plataforma de Badges da Softinsa',
            welcome: 'Olá, {name}',
            intro: 'Recebemos um pedido para repor a password da tua conta na Plataforma de Badges. Clica no botão abaixo para definires uma nova:',
            buttonLabel: 'Repor Password',
            fallbackText: 'Não consegues clicar no botão? Copia e cola este link no teu navegador:',
            expiry: 'Este link é válido por 1 hora por motivos de segurança.',
            note: 'Se não pediste esta alteração, podes ignorar este e-mail com segurança. A tua password atual não será alterada.',
            team: 'A Equipa Softinsa'
        },
        'en-GB': {
            subject: 'Password Reset - Softinsa Badges Platform',
            welcome: 'Hello, {name}',
            intro: 'We received a request to reset your password for the Softinsa Badges Platform. Click the button below to set a new one:',
            buttonLabel: 'Reset Password',
            fallbackText: "Can't click the button? Copy and paste this link into your browser:",
            expiry: 'This link is valid for 1 hour for security reasons.',
            note: 'If you did not request this change, you can safely ignore this email. Your current password will remain unchanged.',
            team: 'The Softinsa Team'
        },
        'es-ES': {
            subject: 'Recuperación de Contraseña - Plataforma de Insignias de Softinsa',
            welcome: 'Hola, {name}',
            intro: 'Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en la Plataforma de Insignias. Haz clic en el botón de abajo para definir una nueva:',
            buttonLabel: 'Restablecer Contraseña',
            fallbackText: '¿No puedes hacer clic en el botón? Copia y pega este enlace en tu navegador:',
            expiry: 'Este enlace es válido por 1 hora por motivos de seguridad.',
            note: 'Si no solicitaste este cambio, puedes ignorar este correo con seguridad. Tu contraseña actual no se verá alterada.',
            team: 'El Equipo de Softinsa'
        }
    };

    const t = templates[lang] || templates['pt-PT'];
    const safeName = escapeHtml(name);
    const welcomeMessage = t.welcome.replace('{name}', safeName);
    const uniqueId = Date.now().toString(36);

    const mailOptions = {
        from: `"Softinsa" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: t.subject,
        html: `
            <div style="background-color: #f9f9f9; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: left;">
                            <img src="${logoUrl}" alt="Softinsa" width="150" style="display: block; border: 0;">
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 40px 20px 40px;">
                            <p style="font-size: 18px; font-weight: 700; line-height: 26px; margin-bottom: 12px;">
                                ${welcomeMessage}
                            </p>
                            <p style="font-size: 16px; line-height: 24px; margin-bottom: 20px;">
                                ${t.intro}
                            </p>
                            
                            <div style="text-align: center; padding: 20px 0;">
                                <a href="${resetUrl}" style="background: linear-gradient(90deg, #39639C 0%, #00B8E0 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 50px; display: inline-block;">
                                    ${t.buttonLabel}
                                </a>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="background-color: #f0f7ff; padding: 20px; border-radius: 4px; text-align: center;">
                                <p style="font-size: 13px; margin: 0 0 10px 0; color: #666666;">${t.fallbackText}</p>
                                <a href="${resetUrl}" style="color: #0062ff; font-size: 12px; word-break: break-all; text-decoration: underline;">
                                    ${resetUrl}
                                </a>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 30px 40px 40px 40px; font-size: 14px; line-height: 22px; color: #555555;">
                            <p style="margin-bottom: 15px;">${t.expiry}</p>
                            <p style="margin-bottom: 25px;">${t.note}</p>
                            <p style="margin-bottom: 0;">— ${t.team}</p>
                        </td>
                    </tr>
                </table>

                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
                    <tr>
                        <td style="padding: 20px 0; text-align: center; font-size: 12px; color: #999999; line-height: 18px;">
                            &copy; ${new Date().getFullYear()} Softinsa. <br>
                            Edifício Office Oriente, Rua do Mar da China nº3 - B6, Parque das Nações, 1990-138 Lisboa
                        </td>
                    </tr>
                </table>
                <div style="display: none; max-height: 0px; overflow: hidden;">
                    Request-ID: ${uniqueId}
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        logger.error("Error sending reset email:", error);
        return { success: false, error };
    }
};

// ─── Shared helpers ──────────────────────────────────────────────────────────

const buildEmailWrapper = (bodyRows, uniqueId) => `
    <div style="background-color:#f9f9f9;padding:40px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#333333;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600"
               style="background-color:#ffffff;border-radius:4px;overflow:hidden;border-collapse:collapse;">
            <tr>
                <td style="padding:40px 40px 20px 40px;text-align:left;">
                    <img src="${logoUrl}" alt="Softinsa" width="150" style="display:block;border:0;">
                </td>
            </tr>
            ${bodyRows}
        </table>
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
            <tr>
                <td style="padding:20px 0;text-align:center;font-size:12px;color:#999999;line-height:18px;">
                    &copy; ${new Date().getFullYear()} Softinsa.<br>
                    Edifício Office Oriente, Rua do Mar da China nº3 - B6, Parque das Nações, 1990-138 Lisboa
                </td>
            </tr>
        </table>
        <div style="display:none;max-height:0px;overflow:hidden;">ID:${uniqueId}</div>
    </div>`;

const ctaButton = (label, url) => `
    <div style="text-align:center;padding:20px 0;">
        <a href="${url}"
           style="background:linear-gradient(90deg,#39639C 0%,#00B8E0 100%);color:#ffffff;padding:15px 40px;
                  text-decoration:none;font-size:16px;font-weight:bold;border-radius:50px;display:inline-block;">
            ${label}
        </a>
    </div>`;

// ─── Application emails ───────────────────────────────────────────────────────

const APPLICATION_EMAIL_TEMPLATES = {
    submitted: {
        'pt-PT': {
            subject: 'Candidatura submetida',
            greeting: 'Olá, {name}',
            intro: 'A tua candidatura ao badge <strong>{badgeTitle}</strong> foi submetida com sucesso.',
            body: 'Iremos notificar-te assim que a candidatura for analisada pelo Talent Manager. Podes acompanhar o estado a qualquer momento através da plataforma.',
            cta: 'Ver Candidatura',
            team: 'A Equipa Softinsa'
        },
        'en-GB': {
            subject: 'Application submitted',
            greeting: 'Hello, {name}',
            intro: 'Your application for the badge <strong>{badgeTitle}</strong> has been successfully submitted.',
            body: 'We will notify you once your application has been reviewed by the Talent Manager. You can track its status at any time on the platform.',
            cta: 'View Application',
            team: 'The Softinsa Team'
        },
        'es-ES': {
            subject: 'Candidatura enviada',
            greeting: 'Hola, {name}',
            intro: 'Tu candidatura al badge <strong>{badgeTitle}</strong> ha sido enviada con éxito.',
            body: 'Te notificaremos cuando el Talent Manager la haya revisado. Puedes seguir su estado en cualquier momento desde la plataforma.',
            cta: 'Ver Candidatura',
            team: 'El Equipo de Softinsa'
        }
    },
    approved: {
        'pt-PT': {
            subject: 'Candidatura aprovada',
            greeting: 'Parabéns, {name}!',
            intro: 'A tua candidatura ao badge <strong>{badgeTitle}</strong> foi aprovada!',
            body: 'O teu badge foi atribuído e já está disponível no teu perfil. Parabéns pela conquista!',
            cta: 'Ver Candidatura',
            team: 'A Equipa Softinsa'
        },
        'en-GB': {
            subject: 'Application approved',
            greeting: 'Congratulations, {name}!',
            intro: 'Your application for the badge <strong>{badgeTitle}</strong> has been approved!',
            body: 'Your badge has been awarded and is now available on your profile. Well done on this achievement!',
            cta: 'View Application',
            team: 'The Softinsa Team'
        },
        'es-ES': {
            subject: 'Candidatura aprobada',
            greeting: '¡Enhorabuena, {name}!',
            intro: '¡Tu candidatura al badge <strong>{badgeTitle}</strong> ha sido aprobada!',
            body: 'Tu badge ha sido concedido y ya está disponible en tu perfil. ¡Felicidades por este logro!',
            cta: 'Ver Candidatura',
            team: 'El Equipo de Softinsa'
        }
    },
    rejected: {
        'pt-PT': {
            subject: 'Candidatura rejeitada',
            greeting: 'Olá, {name}',
            intro: 'A tua candidatura ao badge <strong>{badgeTitle}</strong> foi rejeitada.',
            reasonLabel: 'Motivo indicado pelo avaliador:',
            body: 'Podes rever as evidências submetidas e, se necessário, iniciar uma nova candidatura.',
            cta: 'Ver Candidatura',
            team: 'A Equipa Softinsa'
        },
        'en-GB': {
            subject: 'Application rejected',
            greeting: 'Hello, {name}',
            intro: 'Your application for the badge <strong>{badgeTitle}</strong> has been rejected.',
            reasonLabel: 'Reason provided by the reviewer:',
            body: 'You may review the submitted evidence and, if appropriate, start a new application.',
            cta: 'View Application',
            team: 'The Softinsa Team'
        },
        'es-ES': {
            subject: 'Candidatura rechazada',
            greeting: 'Hola, {name}',
            intro: 'Tu candidatura al badge <strong>{badgeTitle}</strong> ha sido rechazada.',
            reasonLabel: 'Motivo indicado por el evaluador:',
            body: 'Puedes revisar las evidencias enviadas y, si lo consideras oportuno, iniciar una nueva candidatura.',
            cta: 'Ver Candidatura',
            team: 'El Equipo de Softinsa'
        }
    },
    pendingSllReview: {
        'pt-PT': {
            subject: 'Candidatura para validação final',
            greeting: 'Olá, {name}',
            intro: 'A candidatura de <strong>{consultant}</strong> ao badge <strong>{badgeTitle}</strong> foi validada pelo Talent Manager e aguarda a tua decisão final.',
            body: 'Acede à plataforma para rever as evidências e aprovar, rejeitar ou devolver a candidatura ao consultor.',
            cta: 'Rever Candidatura',
            team: 'A Equipa Softinsa'
        },
        'en-GB': {
            subject: 'Application awaiting final validation',
            greeting: 'Hello, {name}',
            intro: 'The application from <strong>{consultant}</strong> for the badge <strong>{badgeTitle}</strong> has been validated by the Talent Manager and awaits your final decision.',
            body: 'Open the platform to review the evidence and approve, reject or return the application to the consultant.',
            cta: 'Review Application',
            team: 'The Softinsa Team'
        },
        'es-ES': {
            subject: 'Candidatura para validación final',
            greeting: 'Hola, {name}',
            intro: 'La candidatura de <strong>{consultant}</strong> al badge <strong>{badgeTitle}</strong> ha sido validada por el Talent Manager y espera tu decisión final.',
            body: 'Accede a la plataforma para revisar las evidencias y aprobar, rechazar o devolver la candidatura al consultor.',
            cta: 'Revisar Candidatura',
            team: 'El Equipo de Softinsa'
        }
    }
};

const resolveApplicationTemplate = (type, lang) =>
    APPLICATION_EMAIL_TEMPLATES[type][lang] || APPLICATION_EMAIL_TEMPLATES[type]['en-GB'];

/**
 * @param {string} email
 * @param {string} name
 * @param {string} badgeTitle
 * @param {string} applicationUrl  Full URL to the application page
 * @param {string} lang            language_iso (e.g. 'pt-PT')
 */
const sendApplicationSubmittedEmail = async (email, name, badgeTitle, applicationUrl, lang) => {
    const t = resolveApplicationTemplate('submitted', lang);
    const safeName = escapeHtml(name);
    const safeBadge = escapeHtml(badgeTitle);
    const uniqueId = Date.now().toString(36);

    const bodyRows = `
        <tr>
            <td style="padding:0 40px 30px 40px;font-size:15px;line-height:24px;color:#333333;">
                <p style="font-size:18px;font-weight:700;margin-bottom:12px;">
                    ${t.greeting.replace('{name}', safeName)}
                </p>
                <p style="margin-bottom:16px;">${t.intro.replace('{badgeTitle}', safeBadge)}</p>
                <p style="margin-bottom:0;color:#555555;">${t.body}</p>
                ${ctaButton(t.cta, applicationUrl)}
                <p style="margin-top:24px;margin-bottom:0;">— ${t.team}</p>
            </td>
        </tr>`;

    try {
        await transporter.sendMail({
            from: `"Softinsa" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: t.subject,
            html: buildEmailWrapper(bodyRows, uniqueId)
        });
        return { success: true };
    } catch (error) {
        logger.error('Error sending application submitted email', { error });
        return { success: false, error };
    }
};

/**
 * Notifies a Service Line Leader that an application reached their queue
 * ("In validation") and awaits final decision.
 * @param {string} email
 * @param {string} name        Service Line Leader name
 * @param {string} consultant  Applicant consultant name
 * @param {string} badgeTitle
 * @param {string} applicationUrl
 * @param {string} lang
 */
const sendApplicationPendingSllReviewEmail = async (email, name, consultant, badgeTitle, applicationUrl, lang) => {
    const t = resolveApplicationTemplate('pendingSllReview', lang);
    const safeName = escapeHtml(name);
    const safeConsultant = escapeHtml(consultant);
    const safeBadge = escapeHtml(badgeTitle);
    const uniqueId = Date.now().toString(36);

    const bodyRows = `
        <tr>
            <td style="padding:0 40px 30px 40px;font-size:15px;line-height:24px;color:#333333;">
                <p style="font-size:18px;font-weight:700;margin-bottom:12px;">
                    ${t.greeting.replace('{name}', safeName)}
                </p>
                <p style="margin-bottom:16px;">${t.intro.replace('{consultant}', safeConsultant).replace('{badgeTitle}', safeBadge)}</p>
                <p style="margin-bottom:0;color:#555555;">${t.body}</p>
                ${ctaButton(t.cta, applicationUrl)}
                <p style="margin-top:24px;margin-bottom:0;">— ${t.team}</p>
            </td>
        </tr>`;

    try {
        await transporter.sendMail({
            from: `"Softinsa" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: t.subject,
            html: buildEmailWrapper(bodyRows, uniqueId)
        });
        return { success: true };
    } catch (error) {
        logger.error('Error sending application pending SLL review email', { error });
        return { success: false, error };
    }
};

/**
 * @param {string} email
 * @param {string} name
 * @param {string} badgeTitle
 * @param {string} applicationUrl
 * @param {string} lang
 */
const sendApplicationApprovedEmail = async (email, name, badgeTitle, applicationUrl, lang) => {
    const t = resolveApplicationTemplate('approved', lang);
    const safeName = escapeHtml(name);
    const safeBadge = escapeHtml(badgeTitle);
    const uniqueId = Date.now().toString(36);

    const bodyRows = `
        <tr>
            <td style="padding:0 40px 30px 40px;font-size:15px;line-height:24px;color:#333333;">
                <p style="font-size:18px;font-weight:700;margin-bottom:12px;">
                    ${t.greeting.replace('{name}', safeName)}
                </p>
                <p style="margin-bottom:16px;">${t.intro.replace('{badgeTitle}', safeBadge)}</p>
                <p style="margin-bottom:0;color:#555555;">${t.body}</p>
                ${ctaButton(t.cta, applicationUrl)}
                <p style="margin-top:24px;margin-bottom:0;">— ${t.team}</p>
            </td>
        </tr>`;

    try {
        await transporter.sendMail({
            from: `"Softinsa" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: t.subject,
            html: buildEmailWrapper(bodyRows, uniqueId)
        });
        return { success: true };
    } catch (error) {
        logger.error('Error sending application approved email', { error });
        return { success: false, error };
    }
};

/**
 * @param {string} email
 * @param {string} name
 * @param {string} badgeTitle
 * @param {string|null} reviewerNotes
 * @param {string} applicationUrl
 * @param {string} lang
 */
const sendApplicationRejectedEmail = async (email, name, badgeTitle, reviewerNotes, applicationUrl, lang) => {
    const t = resolveApplicationTemplate('rejected', lang);
    const safeName = escapeHtml(name);
    const safeBadge = escapeHtml(badgeTitle);
    const uniqueId = Date.now().toString(36);

    const reasonBlock = reviewerNotes
        ? `<div style="background-color:#fff3f3;border-left:4px solid #e74c3c;padding:16px 20px;
                       border-radius:0 4px 4px 0;margin:16px 0;">
               <p style="font-size:13px;font-weight:600;color:#c0392b;margin:0 0 8px 0;">
                   ${t.reasonLabel}
               </p>
               <p style="font-size:14px;color:#555555;margin:0;">${escapeHtml(reviewerNotes)}</p>
           </div>`
        : '';

    const bodyRows = `
        <tr>
            <td style="padding:0 40px 30px 40px;font-size:15px;line-height:24px;color:#333333;">
                <p style="font-size:18px;font-weight:700;margin-bottom:12px;">
                    ${t.greeting.replace('{name}', safeName)}
                </p>
                <p style="margin-bottom:16px;">${t.intro.replace('{badgeTitle}', safeBadge)}</p>
                ${reasonBlock}
                <p style="margin-bottom:0;color:#555555;">${t.body}</p>
                ${ctaButton(t.cta, applicationUrl)}
                <p style="margin-top:24px;margin-bottom:0;">— ${t.team}</p>
            </td>
        </tr>`;

    try {
        await transporter.sendMail({
            from: `"Softinsa" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: t.subject,
            html: buildEmailWrapper(bodyRows, uniqueId)
        });
        return { success: true };
    } catch (error) {
        logger.error('Error sending application rejected email', { error });
        return { success: false, error };
    }
};

const SLA_BREACH_TEMPLATES = {
    'pt-PT': {
        subject: 'Alerta de SLA ultrapassado',
        heading: 'SLA ultrapassado',
        intro: 'A candidatura de {applicantName} ao badge <strong>{badgeTitle}</strong> ultrapassou o tempo de resposta definido.',
        details: 'Tempo excedido: <strong>{hoursExceeded} horas</strong>.',
        profile: 'Perfil responsavel: {targetProfile}.',
        team: 'A Equipa Softinsa'
    },
    'en-GB': {
        subject: 'SLA breach alert',
        heading: 'SLA breach detected',
        intro: "{applicantName}'s application for the badge <strong>{badgeTitle}</strong> has exceeded the configured response time.",
        details: 'Hours exceeded: <strong>{hoursExceeded}</strong>.',
        profile: 'Responsible profile: {targetProfile}.',
        team: 'The Softinsa Team'
    },
    'es-ES': {
        subject: 'Alerta de SLA superado',
        heading: 'SLA superado',
        intro: 'La candidatura de {applicantName} al badge <strong>{badgeTitle}</strong> ha superado el tiempo de respuesta configurado.',
        details: 'Horas excedidas: <strong>{hoursExceeded}</strong>.',
        profile: 'Perfil responsable: {targetProfile}.',
        team: 'El Equipo de Softinsa'
    }
};

const resolveSlaBreachTemplate = (lang) =>
    SLA_BREACH_TEMPLATES[lang] || SLA_BREACH_TEMPLATES['en-GB'];

const sendSlaBreachAlert = async (email, emailData) => {
    const lang = emailData.targetLanguage || emailData.language || 'en-GB';
    const t = resolveSlaBreachTemplate(lang);
    const uniqueId = Date.now().toString(36);
    const safeApplicant = escapeHtml(emailData.applicantName);
    const safeBadge = escapeHtml(emailData.badgeTitle);
    const safeTargetProfile = escapeHtml(emailData.targetProfile);
    const safeHoursExceeded = escapeHtml(emailData.hoursExceeded);

    const bodyRows = `
        <tr>
            <td style="padding:0 40px 30px 40px;font-size:15px;line-height:24px;color:#333333;">
                <p style="font-size:18px;font-weight:700;margin-bottom:12px;">${t.heading}</p>
                <p style="margin-bottom:16px;">
                    ${t.intro
                        .replace('{applicantName}', safeApplicant)
                        .replace('{badgeTitle}', safeBadge)}
                </p>
                <div style="background-color:#fff8e6;border-left:4px solid #f5a623;padding:16px 20px;
                            border-radius:0 4px 4px 0;margin:16px 0;">
                    <p style="font-size:14px;color:#555555;margin:0 0 8px 0;">
                        ${t.details.replace('{hoursExceeded}', safeHoursExceeded)}
                    </p>
                    <p style="font-size:14px;color:#555555;margin:0;">
                        ${t.profile.replace('{targetProfile}', safeTargetProfile)}
                    </p>
                </div>
                <p style="margin-top:24px;margin-bottom:0;">- ${t.team}</p>
            </td>
        </tr>`;

    try {
        await transporter.sendMail({
            from: `"Softinsa" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: t.subject,
            html: buildEmailWrapper(bodyRows, uniqueId)
        });
        return { success: true };
    } catch (error) {
        logger.error('Error sending SLA breach alert', { error });
        return { success: false, error };
    }
};

const CUSTOM_SLA_BREACH_TEMPLATES = {
    'pt-PT': {
        subject: 'Alerta de SLA expirado',
        heading: 'SLA expirado',
        greeting: 'Ola, {name}',
        intro: 'O SLA <strong>{slaName}</strong> expirou.',
        target: 'Perfil alvo: {targetProfile}.',
        deadline: 'Prazo: {deadline}.',
        descriptionLabel: 'Descricao:',
        team: 'A Equipa Softinsa'
    },
    'en-GB': {
        subject: 'Custom SLA breach alert',
        heading: 'Custom SLA expired',
        greeting: 'Hello, {name}',
        intro: 'The SLA <strong>{slaName}</strong> has expired.',
        target: 'Target profile: {targetProfile}.',
        deadline: 'Deadline: {deadline}.',
        descriptionLabel: 'Description:',
        team: 'The Softinsa Team'
    },
    'es-ES': {
        subject: 'Alerta de SLA expirado',
        heading: 'SLA expirado',
        greeting: 'Hola, {name}',
        intro: 'El SLA <strong>{slaName}</strong> ha expirado.',
        target: 'Perfil objetivo: {targetProfile}.',
        deadline: 'Fecha limite: {deadline}.',
        descriptionLabel: 'Descripcion:',
        team: 'El Equipo de Softinsa'
    }
};

const resolveCustomSlaBreachTemplate = (lang) =>
    CUSTOM_SLA_BREACH_TEMPLATES[lang] || CUSTOM_SLA_BREACH_TEMPLATES['en-GB'];

const formatDeadline = (deadline) => {
    if (!deadline) return '';

    const parsed = new Date(deadline);
    if (Number.isNaN(parsed.getTime())) return String(deadline);

    return parsed.toISOString();
};

const sendCustomSlaBreachAlert = async (email, emailData) => {
    const lang = emailData.targetLanguage || emailData.language || 'en-GB';
    const t = resolveCustomSlaBreachTemplate(lang);
    const uniqueId = Date.now().toString(36);
    const safeName = escapeHtml(emailData.recipientName);
    const safeSlaName = escapeHtml(emailData.slaName);
    const safeTargetProfile = escapeHtml(emailData.targetProfile);
    const safeDeadline = escapeHtml(formatDeadline(emailData.deadline));
    const safeDescription = escapeHtml(emailData.slaDescription);

    const descriptionBlock = safeDescription
        ? `<div style="background-color:#f0f7ff;border-left:4px solid #39639C;padding:16px 20px;
                       border-radius:0 4px 4px 0;margin:16px 0;">
               <p style="font-size:13px;font-weight:600;color:#39639C;margin:0 0 8px 0;">
                   ${t.descriptionLabel}
               </p>
               <p style="font-size:14px;color:#555555;margin:0;">${safeDescription}</p>
           </div>`
        : '';

    const bodyRows = `
        <tr>
            <td style="padding:0 40px 30px 40px;font-size:15px;line-height:24px;color:#333333;">
                <p style="font-size:18px;font-weight:700;margin-bottom:12px;">${t.heading}</p>
                <p style="margin-bottom:16px;">${t.greeting.replace('{name}', safeName)}</p>
                <p style="margin-bottom:16px;">${t.intro.replace('{slaName}', safeSlaName)}</p>
                <p style="margin-bottom:8px;color:#555555;">
                    ${t.target.replace('{targetProfile}', safeTargetProfile)}
                </p>
                <p style="margin-bottom:0;color:#555555;">
                    ${t.deadline.replace('{deadline}', safeDeadline)}
                </p>
                ${descriptionBlock}
                <p style="margin-top:24px;margin-bottom:0;">- ${t.team}</p>
            </td>
        </tr>`;

    try {
        await transporter.sendMail({
            from: `"Softinsa" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: t.subject,
            html: buildEmailWrapper(bodyRows, uniqueId)
        });
        return { success: true };
    } catch (error) {
        logger.error('Error sending custom SLA breach alert', { error });
        return { success: false, error };
    }
};

// ─── Badge expiration & objective reminder emails ───────────────────────────
const REMINDER_TEMPLATES = {
    expiring: {
        'pt-PT': { subject: 'O teu badge está perto de expirar', greeting: 'Olá {name},', intro: 'O teu badge <strong>{badgeTitle}</strong> expira em {days} dia(s).', body: 'Renova ou revalida a tempo para manteres a tua credencial ativa.', cta: 'Ver badge', team: 'A Equipa Softinsa' },
        'en-GB': { subject: 'Your badge is expiring soon', greeting: 'Hi {name},', intro: 'Your badge <strong>{badgeTitle}</strong> expires in {days} day(s).', body: 'Renew or revalidate in time to keep your credential active.', cta: 'View badge', team: 'The Softinsa Team' },
        'es-ES': { subject: 'Tu badge está por expirar', greeting: 'Hola {name},', intro: 'Tu badge <strong>{badgeTitle}</strong> expira en {days} día(s).', body: 'Renueva o revalida a tiempo para mantener tu credencial activa.', cta: 'Ver badge', team: 'El Equipo de Softinsa' }
    },
    expired: {
        'pt-PT': { subject: 'O teu badge expirou', greeting: 'Olá {name},', intro: 'O teu badge <strong>{badgeTitle}</strong> expirou.', body: 'Podes voltar a candidatar-te para o renovar.', cta: 'Ver badge', team: 'A Equipa Softinsa' },
        'en-GB': { subject: 'Your badge has expired', greeting: 'Hi {name},', intro: 'Your badge <strong>{badgeTitle}</strong> has expired.', body: 'You can apply again to renew it.', cta: 'View badge', team: 'The Softinsa Team' },
        'es-ES': { subject: 'Tu badge ha expirado', greeting: 'Hola {name},', intro: 'Tu badge <strong>{badgeTitle}</strong> ha expirado.', body: 'Puedes volver a postular para renovarlo.', cta: 'Ver badge', team: 'El Equipo de Softinsa' }
    },
    objective: {
        'pt-PT': { subject: 'Objetivo perto do prazo', greeting: 'Olá {name},', intro: 'O teu objetivo <strong>{title}</strong> está a aproximar-se do prazo.', body: 'Não te esqueças de o concluir a tempo.', cta: 'Ver objetivos', team: 'A Equipa Softinsa' },
        'en-GB': { subject: 'Objective due soon', greeting: 'Hi {name},', intro: 'Your objective <strong>{title}</strong> is nearing its deadline.', body: "Don't forget to complete it in time.", cta: 'View objectives', team: 'The Softinsa Team' },
        'es-ES': { subject: 'Objetivo próximo a vencer', greeting: 'Hola {name},', intro: 'Tu objetivo <strong>{title}</strong> está cerca de su fecha límite.', body: 'No olvides completarlo a tiempo.', cta: 'Ver objetivos', team: 'El Equipo de Softinsa' }
    }
};

const resolveReminderTemplate = (kind, lang) =>
    (REMINDER_TEMPLATES[kind] && (REMINDER_TEMPLATES[kind][lang] || REMINDER_TEMPLATES[kind]['en-GB']));

const sendReminderEmail = async (kind, email, replacements, url, lang) => {
    const t = resolveReminderTemplate(kind, lang);
    if (!t || !email) return { success: false };
    const uniqueId = Date.now().toString(36);
    let intro = t.intro;
    for (const [k, v] of Object.entries(replacements)) {
        intro = intro.replace(`{${k}}`, escapeHtml(String(v)));
    }
    const bodyRows = `
        <tr>
            <td style="padding:0 40px 30px 40px;font-size:15px;line-height:24px;color:#333333;">
                <p style="font-size:18px;font-weight:700;margin-bottom:12px;">${t.greeting.replace('{name}', escapeHtml(replacements.name || ''))}</p>
                <p style="margin-bottom:16px;">${intro}</p>
                <p style="margin-bottom:0;color:#555555;">${t.body}</p>
                ${ctaButton(t.cta, url)}
                <p style="margin-top:24px;margin-bottom:0;">— ${t.team}</p>
            </td>
        </tr>`;
    try {
        await transporter.sendMail({
            from: `"Softinsa" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: t.subject,
            html: buildEmailWrapper(bodyRows, uniqueId)
        });
        return { success: true };
    } catch (error) {
        logger.error('Error sending reminder email', { error, kind });
        return { success: false, error };
    }
};

const sendBadgeExpiringEmail = (email, { name, badgeTitle, days, badgeUrl, lang }) =>
    sendReminderEmail('expiring', email, { name, badgeTitle, days }, badgeUrl, lang);
const sendBadgeExpiredEmail = (email, { name, badgeTitle, badgeUrl, lang }) =>
    sendReminderEmail('expired', email, { name, badgeTitle }, badgeUrl, lang);
const sendObjectiveReminderEmail = (email, { name, title, objectivesUrl, lang }) =>
    sendReminderEmail('objective', email, { name, title }, objectivesUrl, lang);

const REWARD_REDEMPTION_TEMPLATES = {
    'pt-PT': {
        subject: 'A tua recompensa Softinsa',
        greeting: 'Olá, {name}',
        intro: 'Resgataste com sucesso a recompensa <strong>{rewardName}</strong>{points}.',
        pointsWord: 'pontos',
        cta: 'Aceder',
        team: 'A Equipa Softinsa'
    },
    'en-GB': {
        subject: 'Your Softinsa reward',
        greeting: 'Hello, {name}',
        intro: 'You have successfully redeemed the reward <strong>{rewardName}</strong>{points}.',
        pointsWord: 'points',
        cta: 'Access',
        team: 'The Softinsa Team'
    },
    'es-ES': {
        subject: 'Tu recompensa Softinsa',
        greeting: 'Hola, {name}',
        intro: 'Has canjeado con éxito la recompensa <strong>{rewardName}</strong>{points}.',
        pointsWord: 'puntos',
        cta: 'Acceder',
        team: 'El Equipo de Softinsa'
    }
};

const resolveRewardTemplate = (lang) =>
    REWARD_REDEMPTION_TEMPLATES[lang] || REWARD_REDEMPTION_TEMPLATES['en-GB'];

// Sent when a consultant redeems a points-store reward. Carries the (static)
// access info / link for the course or perk. Localized via the user's language.
const sendRewardRedemptionEmail = async (email, name, { rewardName, accessLink, accessInfo, costPoints }, lang) => {
    const t = resolveRewardTemplate(lang);
    const safeName = escapeHtml(name);
    const safeReward = escapeHtml(rewardName);
    const safeInfo = escapeHtml(accessInfo || '');
    const uniqueId = Date.now().toString(36);

    const pointsSegment = costPoints != null ? ` (${costPoints} ${t.pointsWord})` : '';
    const intro = t.intro.replace('{rewardName}', safeReward).replace('{points}', pointsSegment);

    const bodyRows = `
        <tr>
            <td style="padding:0 40px 30px 40px;font-size:15px;line-height:24px;color:#333333;">
                <p style="font-size:18px;font-weight:700;margin-bottom:12px;">${t.greeting.replace('{name}', safeName)}</p>
                <p style="margin-bottom:16px;">${intro}</p>
                ${safeInfo ? `<p style="margin-bottom:16px;color:#555555;">${safeInfo}</p>` : ''}
                ${accessLink ? ctaButton(t.cta, accessLink) : ''}
                <p style="margin-top:24px;margin-bottom:0;">— ${t.team}</p>
            </td>
        </tr>`;

    try {
        await transporter.sendMail({
            from: `"Softinsa" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: t.subject,
            html: buildEmailWrapper(bodyRows, uniqueId)
        });
        return { success: true };
    } catch (error) {
        logger.error('Error sending reward redemption email', { error });
        return { success: false, error };
    }
};

module.exports = {
    sendConfirmationEmail,
    sendResetPasswordEmail,
    sendApplicationSubmittedEmail,
    sendApplicationPendingSllReviewEmail,
    sendApplicationApprovedEmail,
    sendApplicationRejectedEmail,
    sendSlaBreachAlert,
    sendCustomSlaBreachAlert,
    sendBadgeExpiringEmail,
    sendBadgeExpiredEmail,
    sendObjectiveReminderEmail,
    sendRewardRedemptionEmail
};
