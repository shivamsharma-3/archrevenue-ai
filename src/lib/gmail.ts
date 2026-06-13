export const sendEmailViaGmail = async (to: string, subject: string, body: string, token: string) => {
  // Construct MIME email
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  
  const messageParts = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    `Content-Type: text/html; charset="UTF-8"`,
    'MIME-Version: 1.0',
    '',
    // Replace newlines with <br> for HTML email if needed, or just send body
    body.replace(/\n/g, '<br>')
  ];

  const message = messageParts.join('\r\n');

  // Convert string to base64url format
  const bytes = new TextEncoder().encode(message);
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
  const encodedEmail = btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedEmail
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gmail API Error:', errorText);
    throw new Error('Failed to send email via Gmail');
  }

  return await response.json();
};
