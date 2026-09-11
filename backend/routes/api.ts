import { Router, Request, Response } from 'express';
import { analyzeProblem, generateComplaint, chatWithAssistant } from '../controllers/aiController.js';
import { getAllServices, getServiceById } from '../controllers/servicesController.js';
import { getAllOffices, getNearbyOffices } from '../controllers/officesController.js';
import { getEmergencyContacts, getVerifiedSources } from '../controllers/emergencyController.js';
import { resolveLocation } from '../controllers/locationController.js';
import { 
  registerCitizen, 
  loginCitizen, 
  verify2FACode, 
  initiate2FASetup,
  confirm2FASetup,
  resend2FACode,
  disable2FA,
  registerOrUpdateDevice,
  toggleDeviceTrust,
  renameDevice,
  revokeDeviceSession,
  cleanupInvalidDevices,
  updateSecuritySettings, 
  rotateRecoveryKey, 
  getSecurityAuditLogs, 
  terminateOtherSessions,
  requestPasswordReset,
  completePasswordReset,
  logoutCitizen,
  googleLogin,
  getCurrentUser
} from '../controllers/authController.js';
import { submitFeedback, getRecentFeedback } from '../controllers/feedbackController.js';

export const apiRouter = Router();

// Authentication & Citizen Security Endpoints
apiRouter.post('/auth/register', registerCitizen);
apiRouter.post('/auth/login', loginCitizen);
apiRouter.post('/auth/verify-2fa', verify2FACode);
apiRouter.post('/auth/2fa/setup', initiate2FASetup);
apiRouter.post('/auth/2fa/confirm', confirm2FASetup);
apiRouter.post('/auth/2fa/resend', resend2FACode);
apiRouter.post('/auth/2fa/disable', disable2FA);
apiRouter.post('/auth/logout', logoutCitizen);
apiRouter.post('/auth/google', googleLogin);
apiRouter.get('/auth/me', getCurrentUser);

// Device & Authorized Session Management
apiRouter.post('/auth/devices/register', registerOrUpdateDevice);
apiRouter.post('/auth/devices/trust', toggleDeviceTrust);
apiRouter.post('/auth/devices/rename', renameDevice);
apiRouter.post('/auth/devices/revoke', revokeDeviceSession);
apiRouter.post('/auth/devices/cleanup-invalid', cleanupInvalidDevices);

apiRouter.post('/auth/forgot-password', requestPasswordReset);
apiRouter.post('/auth/reset-password', completePasswordReset);
apiRouter.post('/auth/security/update', updateSecuritySettings);
apiRouter.post('/auth/security/rotate-recovery-key', rotateRecoveryKey);
apiRouter.get('/auth/security/logs', getSecurityAuditLogs);
apiRouter.post('/auth/security/terminate-sessions', terminateOtherSessions);

// Citizen Feedback Endpoints
apiRouter.post('/feedback', submitFeedback);
apiRouter.get('/feedback', getRecentFeedback);

// AI Intelligence Endpoints
apiRouter.post('/ai/analyze', analyzeProblem);
apiRouter.post('/ai/chat', chatWithAssistant);
apiRouter.post('/ai/generate-complaint', generateComplaint);

// File/Image upload validation endpoint
apiRouter.post('/upload', (req: Request, res: Response) => {
  const { fileName, fileType, base64Data, sizeBytes } = req.body;

  if (!base64Data) {
    res.status(400).json({ error: 'No file data received.' });
    return;
  }

  // 15MB size limit check
  if (sizeBytes && sizeBytes > 15 * 1024 * 1024) {
    res.status(413).json({ error: 'File size exceeds maximum 15MB limit.' });
    return;
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
  if (fileType && !validTypes.includes(fileType)) {
    res.status(415).json({ error: 'Unsupported file format. Please upload JPG, PNG, WebP, or PDF.' });
    return;
  }

  res.json({
    success: true,
    fileId: `file-${Date.now()}`,
    fileName: fileName || 'uploaded-civic-media',
    fileType: fileType || 'image/jpeg',
    receivedAt: new Date().toISOString()
  });
});

// Government Services Directory
apiRouter.get('/services', getAllServices);
apiRouter.get('/services/:id', getServiceById);

// Government Offices Directory & Proximity
apiRouter.get('/offices', getAllOffices);
apiRouter.get('/offices/nearby', getNearbyOffices);

// Emergency & Verified Transparency
apiRouter.get('/emergency', getEmergencyContacts);
apiRouter.get('/sources', getVerifiedSources);

// Geolocation & Jurisdiction
apiRouter.post('/location', resolveLocation);
