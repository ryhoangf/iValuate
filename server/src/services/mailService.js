const nodemailer = require('nodemailer');

/**
 * Gmail: bật 2 bước xác thực → tạo Mật khẩu ứng dụng (App password) → dùng làm SMTP_PASS.
 * .env: SMTP_USER=..., SMTP_PASS=..., optional MAIL_FROM, SMTP_HOST (mặc định smtp.gmail.com), SMTP_PORT (587).
 */
function createTransport() {
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    if (!user || !pass) {
        return null;
    }
    const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
    const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
    const secure =
        process.env.SMTP_SECURE === 'true' ||
        process.env.SMTP_SECURE === '1' ||
        port === 465;

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
    });
}

let cachedTransport;
function getTransport() {
    if (cachedTransport === undefined) {
        cachedTransport = createTransport();
    }
    return cachedTransport;
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
    const transport = getTransport();
    if (!transport) {
        console.warn('[mail] SMTP_USER/SMTP_PASS chưa cấu hình — bỏ qua gửi email.');
        return { sent: false, reason: 'not_configured' };
    }
    const from = process.env.MAIL_FROM?.trim() || process.env.SMTP_USER?.trim() || 'noreply@ivaluate';
    const subject = 'Đặt lại mật khẩu — iValuate';
    const text = [
        'Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản iValuate.',
        '',
        `Mở liên kết sau (có hiệu lực khoảng 1 giờ):`,
        resetUrl,
        '',
        'Nếu bạn không yêu cầu, hãy bỏ qua email này.',
    ].join('\n');
    const html = `
      <p>Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản iValuate.</p>
      <p><a href="${resetUrl.replace(/"/g, '&quot;')}">Đặt lại mật khẩu</a></p>
      <p>Liên kết có hiệu lực khoảng 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    `.trim();

    await transport.sendMail({
        from,
        to: toEmail,
        subject,
        text,
        html,
    });
    return { sent: true };
}

module.exports = {
    sendPasswordResetEmail,
    getTransport,
};
