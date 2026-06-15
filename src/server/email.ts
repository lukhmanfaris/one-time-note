const RESEND_API_URL = "https://api.resend.com/emails";

export interface SendResetEmailResult {
  success: boolean;
  error?: string;
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string,
  apiKey: string,
  frontendUrl: string = "http://localhost:3000",
  fromAddress: string = "onboarding@resend.dev"
): Promise<SendResetEmailResult> {
  const resetLink = `${frontendUrl}/reset?token=${resetToken}`;

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toEmail],
        subject: "Revelio — Reset Your Password",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Reset Your Password</h2>
            <p style="color: #4a4a4a;">You requested a password reset for your Revelio account.</p>
            <p style="color: #4a4a4a;">Click the button below to set a new password. This link expires in 15 minutes.</p>
            <a href="${resetLink}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
            <p style="color: #888888; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { success: false, error: `Email delivery failed: ${errorBody}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Email delivery failed",
    };
  }
}