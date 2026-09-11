import { Request, Response } from 'express';
import { verifiedEmergencyContacts, verifiedSourcesRegistry } from '../data/emergencyData.js';

export const getEmergencyContacts = (req: Request, res: Response): void => {
  res.json({
    emergencyModeTitle: 'Emergency Civic & Disaster Assistance',
    disclaimer: 'For life-threatening emergencies, call 112 directly. IntentBridge provides verified official emergency contacts and protocol guidance.',
    contacts: verifiedEmergencyContacts
  });
};

export const getVerifiedSources = (req: Request, res: Response): void => {
  res.json({
    totalVerifiedSources: verifiedSourcesRegistry.length,
    lastAuditDate: '2026-09-08T00:00:00Z',
    auditStandard: 'NIC / Government of India Citizen Charter Compliance',
    sources: verifiedSourcesRegistry
  });
};
