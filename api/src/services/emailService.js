const nodemailer = require('nodemailer');
const loadEnvironment = require('./loadEnv');
const { logger } = require('../utils/logger');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendConfirmationEmail = async (email, name, token, lang) => {
    const confirmationUrl = `${process.env.APP_URL}/auth/confirm-email?token=${token}`;

    const templates = {
        'pt-PT': {
            subject: 'Confirmação de Registo - Plataforma de Badges da Softinsa',
            greeting: `Olá, ${name}!`,
            intro: 'Obrigado por te registares na plataforma de badges da Softinsa.',
            actionText: 'Para ativares a tua conta, clica no botão abaixo:',
            buttonLabel: 'Confirmar E-mail',
            expiry: 'Este link é válido por 8 horas.',
            note: '<strong>Nota:</strong> No primeiro acesso, terás de alterar a tua password.'
        },
        'en-GB': {
            subject: 'Registration Confirmation - Softinsa Badges Platform',
            greeting: `Hello, ${name}!`,
            intro: 'Thank you for registering on the Softinsa badges platform.',
            actionText: 'To activate your account, click the button below:',
            buttonLabel: 'Confirm Email',
            expiry: 'This link is valid for 8 hours.',
            note: '<strong>Note:</strong> On your first login, you will need to change your password.'
        },
        'es-ES': {
            subject: 'Confirmación de Registro - Plataforma de Insignias de Softinsa',
            greeting: `Hola, ${name}!`,
            intro: 'Gracias por registrarte en la plataforma de insignias de Softinsa.',
            actionText: 'Para activar tu cuenta, haz clic en el botón de abajo:',
            buttonLabel: 'Confirmar Correo',
            expiry: 'Este enlace es válido durante 8 horas.',
            note: '<strong>Nota:</strong> En tu primer acceso, tendrás que cambiar tu contraseña.'
        }
    };

    const selectedTemplate = templates[lang] || templates['pt-PT'];

    const mailOptions = {
        from: `"Plataforma de Badges da Softinsa" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: selectedTemplate.subject,
        html: `
            <div style="font-family: sans-serif; max-width: 600px;">
                <h2>${selectedTemplate.greeting}</h2>
                <p>${selectedTemplate.intro}</p>
                <p>${selectedTemplate.actionText}</p>
                <a href="${confirmationUrl}" style="display: inline-block; background: #0062ff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px;">
                    ${selectedTemplate.buttonLabel}
                </a>
                <p style="margin-top: 20px;">${selectedTemplate.expiry}</p>
                <p>${selectedTemplate.note}</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        logger.error("Error sending email via Gmail:", error);
        return { success: false, error };
    }
};

module.exports = { sendConfirmationEmail };