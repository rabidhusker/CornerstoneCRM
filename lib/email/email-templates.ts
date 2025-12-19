// Email template types
export type EmailTemplateType =
  | "welcome"
  | "conversation_reply"
  | "notification"
  | "password_reset"
  | "invite"
  | "custom";

// Template variables type
export interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

// Template definition
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Base styles for email templates
const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
  .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; }
  .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px; }
  .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 15px 0; }
  .button:hover { background: #5a6fd6; }
  .message-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
  h1 { margin: 0; font-size: 24px; }
  h2 { color: #333; font-size: 20px; }
  p { margin: 0 0 15px 0; }
`;

/**
 * Replace template variables in a string
 */
function replaceVariables(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    if (value !== undefined) {
      return String(value);
    }
    return match; // Keep placeholder if variable not found
  });
}

/**
 * Generate HTML email wrapper
 */
function wrapHtml(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
`.trim();
}

/**
 * Welcome email template
 */
function getWelcomeTemplate(variables: TemplateVariables): EmailTemplate {
  const { userName = "there", companyName = "Cornerstone CRM", loginUrl = "#" } = variables;

  const html = wrapHtml(`
    <div class="header">
      <h1>Welcome to ${companyName}!</h1>
    </div>
    <div class="content">
      <h2>Hi ${userName},</h2>
      <p>Welcome aboard! We're excited to have you join us.</p>
      <p>Your account has been created and you're ready to start managing your contacts, conversations, and more.</p>
      <p style="text-align: center;">
        <a href="${loginUrl}" class="button">Get Started</a>
      </p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  `, `Welcome to ${companyName}`);

  const text = `
Hi ${userName},

Welcome to ${companyName}! We're excited to have you join us.

Your account has been created and you're ready to start managing your contacts, conversations, and more.

Get started: ${loginUrl}

If you have any questions, feel free to reach out to our support team.

© ${new Date().getFullYear()} ${companyName}. All rights reserved.
`.trim();

  return {
    subject: `Welcome to ${companyName}!`,
    html,
    text,
  };
}

/**
 * Conversation reply template
 */
function getConversationReplyTemplate(variables: TemplateVariables): EmailTemplate {
  const {
    contactName = "there",
    senderName = "Our Team",
    messageContent = "",
    companyName = "Cornerstone CRM",
    replyUrl = "#",
  } = variables;

  const html = wrapHtml(`
    <div class="header">
      <h1>${companyName}</h1>
    </div>
    <div class="content">
      <h2>Hi ${contactName},</h2>
      <p>${senderName} sent you a message:</p>
      <div class="message-box">
        ${String(messageContent).replace(/\n/g, "<br>")}
      </div>
      <p style="text-align: center;">
        <a href="${replyUrl}" class="button">Reply</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  `, `Message from ${companyName}`);

  const text = `
Hi ${contactName},

${senderName} sent you a message:

${messageContent}

Reply at: ${replyUrl}

© ${new Date().getFullYear()} ${companyName}. All rights reserved.
`.trim();

  return {
    subject: `Message from ${senderName}`,
    html,
    text,
  };
}

/**
 * Notification template
 */
function getNotificationTemplate(variables: TemplateVariables): EmailTemplate {
  const {
    userName = "there",
    notificationTitle = "New Notification",
    notificationContent = "",
    companyName = "Cornerstone CRM",
    actionUrl = "#",
    actionText = "View Details",
  } = variables;

  const html = wrapHtml(`
    <div class="header">
      <h1>${notificationTitle}</h1>
    </div>
    <div class="content">
      <h2>Hi ${userName},</h2>
      <p>${notificationContent}</p>
      <p style="text-align: center;">
        <a href="${actionUrl}" class="button">${actionText}</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  `, String(notificationTitle));

  const text = `
Hi ${userName},

${notificationTitle}

${notificationContent}

${actionText}: ${actionUrl}

© ${new Date().getFullYear()} ${companyName}. All rights reserved.
`.trim();

  return {
    subject: String(notificationTitle),
    html,
    text,
  };
}

/**
 * Password reset template
 */
function getPasswordResetTemplate(variables: TemplateVariables): EmailTemplate {
  const {
    userName = "there",
    resetUrl = "#",
    expiresIn = "1 hour",
    companyName = "Cornerstone CRM",
  } = variables;

  const html = wrapHtml(`
    <div class="header">
      <h1>Password Reset</h1>
    </div>
    <div class="content">
      <h2>Hi ${userName},</h2>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>
      <p style="font-size: 14px; color: #666;">This link will expire in ${expiresIn}. If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  `, "Password Reset Request");

  const text = `
Hi ${userName},

We received a request to reset your password.

Reset your password: ${resetUrl}

This link will expire in ${expiresIn}. If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} ${companyName}. All rights reserved.
`.trim();

  return {
    subject: "Reset Your Password",
    html,
    text,
  };
}

/**
 * Team invite template
 */
function getInviteTemplate(variables: TemplateVariables): EmailTemplate {
  const {
    inviterName = "Someone",
    workspaceName = "a workspace",
    inviteUrl = "#",
    companyName = "Cornerstone CRM",
  } = variables;

  const html = wrapHtml(`
    <div class="header">
      <h1>You're Invited!</h1>
    </div>
    <div class="content">
      <h2>Hello,</h2>
      <p>${inviterName} has invited you to join <strong>${workspaceName}</strong> on ${companyName}.</p>
      <p style="text-align: center;">
        <a href="${inviteUrl}" class="button">Accept Invitation</a>
      </p>
      <p style="font-size: 14px; color: #666;">This invitation will expire in 7 days.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  `, `Invitation to ${workspaceName}`);

  const text = `
Hello,

${inviterName} has invited you to join ${workspaceName} on ${companyName}.

Accept your invitation: ${inviteUrl}

This invitation will expire in 7 days.

© ${new Date().getFullYear()} ${companyName}. All rights reserved.
`.trim();

  return {
    subject: `${inviterName} invited you to join ${workspaceName}`,
    html,
    text,
  };
}

/**
 * Custom template with variable replacement
 */
function getCustomTemplate(variables: TemplateVariables): EmailTemplate {
  const {
    subject = "Message",
    htmlContent = "",
    textContent = "",
    companyName = "Cornerstone CRM",
  } = variables;

  // If raw HTML provided, use it directly
  if (htmlContent) {
    const html = wrapHtml(`
      <div class="header">
        <h1>${companyName}</h1>
      </div>
      <div class="content">
        ${replaceVariables(String(htmlContent), variables)}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      </div>
    `, String(subject));

    return {
      subject: String(subject),
      html,
      text: textContent ? replaceVariables(String(textContent), variables) : "",
    };
  }

  return {
    subject: String(subject),
    html: "",
    text: textContent ? replaceVariables(String(textContent), variables) : "",
  };
}

/**
 * Render an email template
 */
export function renderTemplate(
  type: EmailTemplateType,
  variables: TemplateVariables = {}
): EmailTemplate {
  switch (type) {
    case "welcome":
      return getWelcomeTemplate(variables);
    case "conversation_reply":
      return getConversationReplyTemplate(variables);
    case "notification":
      return getNotificationTemplate(variables);
    case "password_reset":
      return getPasswordResetTemplate(variables);
    case "invite":
      return getInviteTemplate(variables);
    case "custom":
      return getCustomTemplate(variables);
    default:
      throw new Error(`Unknown template type: ${type}`);
  }
}

/**
 * Parse plain text to HTML (simple conversion)
 */
export function textToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")
    .replace(/  /g, "&nbsp;&nbsp;");
}

/**
 * Strip HTML tags to get plain text
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
