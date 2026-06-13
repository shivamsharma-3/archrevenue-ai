function encodeBase64Url(str: string) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendEmail(to: string, subject: string, body: string, accessToken: string, threadId?: string, previousMessageId?: string) {
  const encodedSubject = btoa(unescape(encodeURIComponent(subject)));
  
  const messageId = `<${crypto.randomUUID()}@archrevenue.local>`;
  
  const emailLines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${encodedSubject}?=`,
    `Message-ID: ${messageId}`,
    'Content-Type: text/plain; charset="UTF-8"',
  ];

  if (previousMessageId) {
    emailLines.push(`In-Reply-To: ${previousMessageId}`);
    emailLines.push(`References: ${previousMessageId}`);
  }

  emailLines.push('');
  emailLines.push(body);

  const emailMessage = emailLines.join('\r\n');
  const encodedEmail = encodeBase64Url(emailMessage);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedEmail,
      ...(threadId ? { threadId } : {})
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('Gmail API error:', errorData);
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED'); // Special catchable error to trigger reconnect
    }
    throw new Error(errorData?.error?.message || 'Failed to send email via Gmail');
  }

  const data = await response.json();
  return { ...data, sentMessageId: messageId };
}
