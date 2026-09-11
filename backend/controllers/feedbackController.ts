import { Request, Response } from 'express';
import { getUserByEmail, getUserByToken, recordActivityEvent } from '../utils/storage.js';

interface StoredFeedback {
  id: string;
  emoji: string;
  rating: number;
  category: string;
  feedbackText: string;
  email?: string;
  experiencedLag: boolean;
  userAgent: string;
  ipAddress: string;
  submittedAt: string;
}

const feedbackStore: StoredFeedback[] = [
  {
    id: 'fb-seed-1',
    emoji: '🤩',
    rating: 5,
    category: 'Grievance Letters',
    feedbackText: 'Generated my official road pothole complaint in under 30 seconds. Municipal ward office acknowledged receipt!',
    email: 'citizen.kiran@example.org',
    experiencedLag: false,
    userAgent: 'Chrome 128 / macOS',
    ipAddress: '49.207.214.18',
    submittedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'fb-seed-2',
    emoji: '🙂',
    rating: 4,
    category: 'Security & Privacy',
    feedbackText: 'Love the 2FA and zero-knowledge master recovery key. UI is super crisp.',
    email: 'aarav@citizen.org',
    experiencedLag: false,
    userAgent: 'Chrome / Pixel 9',
    ipAddress: '49.207.214.99',
    submittedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  }
];

export const submitFeedback = (req: Request, res: Response) => {
  try {
    const { emoji, rating, category, feedbackText, email, experiencedLag = false } = req.body;

    if (!feedbackText || !feedbackText.trim()) {
      res.status(400).json({ error: 'Please enter your feedback text.' });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Modern Web Browser';

    const feedbackEntry: StoredFeedback = {
      id: `fb-${Date.now()}`,
      emoji: emoji || '🙂',
      rating: Number(rating) || 4,
      category: category || 'General Civic Experience',
      feedbackText: feedbackText.trim(),
      email: email ? String(email).trim() : undefined,
      experiencedLag: Boolean(experiencedLag),
      userAgent: userAgent.slice(0, 60),
      ipAddress: clientIp,
      submittedAt: new Date().toISOString()
    };

    feedbackStore.unshift(feedbackEntry);

    // Record activity event for authenticated or matching citizen
    const authHeader = req.headers.authorization;
    let tokenUser = authHeader?.startsWith('Bearer ') ? getUserByToken(authHeader.slice(7).trim()) : undefined;
    const matchedUser = tokenUser || (email ? getUserByEmail(String(email).toLowerCase().trim()) : undefined);

    if (matchedUser) {
      recordActivityEvent({
        userId: matchedUser.id,
        action: 'FEEDBACK_SUBMITTED',
        type: 'profile_updated',
        category: 'account_modification',
        title: 'Citizen Platform Feedback Submitted',
        description: `Submitted rating (${rating}/5) and civic feedback for ${category || 'General Civic Experience'}.`,
        locationTag: `${matchedUser.city || 'Bengaluru'}, KA, India`,
        ipAddress: clientIp,
        deviceInfo: userAgent.slice(0, 60),
        status: 'success'
      });
    }

    res.status(201).json({
      success: true,
      feedbackId: feedbackEntry.id,
      message: 'Thank you for your valuable civic feedback! Your input directly shapes IntentBridge.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit feedback.' });
  }
};

export const getRecentFeedback = (req: Request, res: Response) => {
  res.json({
    success: true,
    feedback: feedbackStore.slice(0, 10),
    totalCount: feedbackStore.length
  });
};
