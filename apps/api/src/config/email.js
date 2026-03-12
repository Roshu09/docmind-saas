import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: parseInt(process.env.EMAIL_SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASS,
  },
});

export const sendOTPEmail = async (to, name, otp) => {
  await transporter.sendMail({
    from: `"AI Doc Intelligence" <${process.env.EMAIL_FROM}>`,
    to,
    subject: '🔐 Verify your email — AI Doc Intelligence',
    html: `
    <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid rgba(124,58,237,0.3)">
      <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:32px;text-align:center">
        <div style="font-size:36px;margin-bottom:8px">🧠</div>
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">AI Doc Intelligence</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">docmind.space</p>
      </div>
      <div style="padding:36px 32px">
        <h2 style="color:#e2e8f0;margin:0 0 8px;font-size:18px">Hi ${name} 👋</h2>
        <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 28px">
          Thanks for signing up! Use the OTP below to verify your email address. It expires in <strong style="color:#a78bfa">10 minutes</strong>.
        </p>
        <div style="background:rgba(124,58,237,0.1);border:2px dashed rgba(124,58,237,0.4);border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
          <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em">Your OTP Code</p>
          <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#a78bfa;font-family:monospace">${otp}</div>
        </div>
        <p style="color:#475569;font-size:12px;text-align:center;margin:0">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
      <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
        <p style="color:#334155;font-size:11px;margin:0">Built by <strong style="color:#7c3aed">Roshan Kumar</strong> · AI Doc Intelligence System</p>
      </div>
    </div>`,
  });
};

export const sendWelcomeEmail = async (to, name) => {
  await transporter.sendMail({
    from: `"AI Doc Intelligence" <${process.env.EMAIL_FROM}>`,
    to,
    subject: '🎉 Welcome to AI Doc Intelligence!',
    html: `
    <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid rgba(124,58,237,0.3)">
      <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:32px;text-align:center">
        <div style="font-size:36px;margin-bottom:8px">🎉</div>
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">Welcome aboard, ${name}!</h1>
      </div>
      <div style="padding:36px 32px">
        <p style="color:#94a3b8;font-size:14px;line-height:1.8;margin:0 0 20px">
          Your email is verified! You now have full access to:
        </p>
        <ul style="color:#94a3b8;font-size:14px;line-height:2;padding-left:20px">
          <li>🔍 <strong style="color:#e2e8f0">Semantic Search</strong> — natural language document search</li>
          <li>🤖 <strong style="color:#e2e8f0">Smart Summarizer</strong> — TL;DR, key points, sentiment</li>
          <li>❓ <strong style="color:#e2e8f0">Q&A Generator</strong> — auto-generate questions</li>
          <li>💬 <strong style="color:#e2e8f0">Knowledge Chat</strong> — chat with your documents</li>
          <li>⚖️ <strong style="color:#e2e8f0">Document Comparison</strong> — AI-powered comparison</li>
        </ul>
        <div style="text-align:center;margin-top:32px">
          <a href="https://docmind.space/dashboard" style="background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">
            🚀 Go to Dashboard
          </a>
        </div>
      </div>
    </div>`,
  });
};
