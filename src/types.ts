export interface GmailAccount {
  email: string;
  connectedAt: string;
  status: 'active' | 'expired';
  refreshToken: string;
  accessToken?: string;
  expiresAt?: number;
}

export interface Contact {
  id: string;
  email: string;
  name: string;
  listName: string;
  createdAt: string;
  company?: string;
  firstName?: string;
  variables?: Record<string, string>;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'normal' | 'auto';
  status: 'draft' | 'running' | 'paused' | 'completed' | 'stopped';
  contactListName: string;
  subject: string;
  bodyTemplate: string; // e.g. "Hi {{name}}, ..."
  // For 'normal' campaigns
  senderEmail?: string;
  delaySeconds: number;
  sendLimit?: number;
  // For 'auto' campaigns
  senderEmails?: string[];
  emailsPerHourPerAccount?: number;
  // Stats
  totalContacts: number;
  sentCount: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
  startedAt?: string;
}

export interface CampaignLog {
  id: string;
  campaignId: string;
  timestamp: string;
  recipient: string;
  sender: string;
  status: 'success' | 'failed';
  subject: string;
  errorMessage?: string;
}

export interface QueueItem {
  id: string;
  campaignId: string;
  recipientEmail: string;
  recipientName: string;
  senderEmail: string;
  status: 'pending' | 'sending' | 'success' | 'failed';
  subject: string;
  body: string;
  delayUntil: number; // timestamp in ms when we can send this item
}
