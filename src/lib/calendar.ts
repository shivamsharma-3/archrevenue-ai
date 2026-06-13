import { Lead } from './types';

export async function bookMeeting(lead: Lead, accessToken: string) {
  // Let's book a meeting for tomorrow at 10 AM local time.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const end = new Date(tomorrow);
  end.setHours(10, 30, 0, 0);

  const event = {
    summary: `Discovery Call: ArchRevenue x ${lead.company || lead.fullName}`,
    description: `Automated booking via AI Meeting Assistant.\nLead: ${lead.fullName}\nEmail: ${lead.email || 'N/A'}\nPhone: ${lead.phone || 'N/A'}\nPain Point: ${lead.painPoint || 'N/A'}\n\nRecommended Action: ${lead.aiAnalysis?.recommendedAction || ''}`,
    start: {
      dateTime: tomorrow.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: lead.email ? [{ email: lead.email }] : [],
    reminders: {
      useDefault: true,
    }
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('Calendar API error:', errorData);
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED'); // Special catchable error to trigger reconnect
    }
    throw new Error(errorData?.error?.message || 'Failed to book meeting on Google Calendar');
  }

  const data = await response.json();
  return data.htmlLink;
}
