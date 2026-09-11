export type UrgencyLevel = 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ServiceCategory = 
  | 'Civic Infrastructure'
  | 'Disaster & Emergency'
  | 'Identity & Civil Documents'
  | 'Revenue & Land'
  | 'Public Grievance'
  | 'Utilities & Electricity'
  | 'Water & Sanitation'
  | 'Healthcare & Welfare'
  | 'Consumer & Legal'
  | 'Transport & Licensing';

export interface RequiredDocumentItem {
  id: string;
  name: string;
  description: string;
  mandatory: boolean;
}

export interface ServiceProcedure {
  step: number;
  title: string;
  instruction: string;
}

export interface GovernmentService {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  level: 'Central' | 'State' | 'Municipal';
  state?: string;
  officialWebsite: string;
  portalName: string;
  helplinePhone?: string;
  email?: string;
  requiredDocuments: RequiredDocumentItem[];
  procedures: ServiceProcedure[];
  sources: string[];
  lastVerified: string;
  turnaroundTime: string;
  feeStructure: string;
}

export interface GovernmentOffice {
  id: string;
  name: string;
  department: string;
  category: ServiceCategory;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  openingHours: string;
  closedDays: string[];
  openTime: string; // e.g. "09:30"
  closeTime: string; // e.g. "17:30"
  services: string[];
  officialWebsite: string;
  source: string;
  lastVerified: string;
  directionsUrl?: string;
  isOpenNow?: boolean;
  distanceKm?: number;
}

export interface OfficialSourceItem {
  name: string;
  url: string;
  verified: boolean;
  lastChecked: string;
  sourceType: 'Government Portal' | 'Official Gazette' | 'Citizen Charter' | 'Emergency Directorate';
  authority: string;
  jurisdiction?: string;
  status?: string;
  notes?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  category: 'National Emergency' | 'Disaster Management' | 'Police & Safety' | 'Medical' | 'Fire' | 'Civic Emergency' | 'Women & Child';
  description: string;
  availableHours: string;
  verifiedOfficial: boolean;
  source: string;
  actionGuideline: string;
  title?: string;
  hours?: string;
}

export interface ProblemAnalysis {
  id: string;
  originalProblem: string;
  understoodSummary: string;
  category: ServiceCategory;
  urgency: UrgencyLevel;
  isEmergency: boolean;
  intent: string;
  locationRequirement: {
    needed: boolean;
    detectedLocation?: string;
    level: 'Local Ward' | 'City Municipal' | 'District' | 'State' | 'National';
  };
  recommendedAuthority: {
    name: string;
    department: string;
    role: string;
    level: string;
  };
  recommendedService?: {
    id: string;
    name: string;
    portalName: string;
    officialWebsite: string;
  };
  actionSteps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    urgentNotice?: string;
  }>;
  reportingChannels: Array<{
    type: 'Online Portal' | 'App' | 'Helpline' | 'Physical Office' | 'Emergency Call';
    name: string;
    linkOrNumber: string;
    verified: boolean;
    notes?: string;
  }>;
  nearbyOffice?: {
    name: string;
    department: string;
    address: string;
    phone: string;
    openingHours: string;
    closedDays: string[];
    officialWebsite: string;
    isOpenNow: boolean;
  };
  requiredDocuments: Array<{
    name: string;
    reason: string;
    isMandatory: boolean;
  }>;
  officialSources: OfficialSourceItem[];
  complaintDraftAvailable: boolean;
  imageAnalysis?: {
    hasImage: boolean;
    visualFindings: string;
    confidence: string;
    hazardLevel: string;
  };
  createdAt: string;
}

export interface ComplaintLetter {
  id: string;
  problemId?: string;
  recipient: {
    designation: string;
    department: string;
    officeAddress: string;
    city: string;
  };
  subject: string;
  applicantInfo: {
    name: string;
    contact: string;
    address: string;
  };
  body: string;
  incidentDetails: {
    location: string;
    dateOrDuration: string;
    impactDescription: string;
  };
  reliefRequested: string[];
  referenceLawOrCharter?: string;
  generatedDate: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  analysisData?: ProblemAnalysis;
  complaintData?: ComplaintLetter;
  isEmergencyAlert?: boolean;
}

export interface CitizenUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city: string;
  ward?: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorMethod: 'sms' | 'authenticator' | 'passkey';
  passkeyEnabled: boolean;
  autoPurgeDays: number;
  localEncryptionEnabled: boolean;
  recoveryKeyGenerated: boolean;
  recoveryKeyPreview?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface SecurityAuditEvent {
  id: string;
  userId?: string;
  action?: string;
  type: 'login' | 'logout' | 'password_change' | 'password_reset_initiated' | '2fa_toggle' | 'passkey_register' | 'recovery_key_download' | 'session_terminated' | 'data_purged' | 'profile_updated' | 'ai_analysis' | 'complaint_generated' | 'feedback_submitted' | string;
  category?: 'login_attempt' | 'account_modification' | 'session_device' | 'privacy_purge' | 'security_warning' | 'ai_activity' | 'civic_action' | string;
  title: string;
  description: string;
  locationTag?: string;
  ipAddress: string;
  deviceInfo: string;
  status: 'success' | 'warning' | 'critical';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface FeedbackSubmission {
  id?: string;
  emoji: string;
  rating: number; // 1 to 5
  category: string;
  feedbackText: string;
  email?: string;
  submittedAt?: string;
  experiencedLag?: boolean;
}

export interface DiagnosticsStatus {
  latencyMs: number;
  apiHealth: 'healthy' | 'degraded' | 'offline';
  mainThreadResponsive: boolean;
  localStorageKb: number;
  memoryUsageMb?: number;
  browserOnline: boolean;
  reducedMotion: boolean;
}

export interface ActiveSession {
  id: string;
  deviceId?: string;
  device: string;
  deviceName?: string;
  browser: string;
  os?: string;
  deviceType?: 'desktop' | 'laptop' | 'mobile' | 'tablet' | 'unknown';
  location: string;
  ip: string;
  current: boolean;
  trusted?: boolean;
  trustedUntil?: string;
  createdAt?: string;
  lastActive: string;
}

export interface TwoFactorSetupData {
  secret?: string;
  qrCodeUrl?: string;
  otpauthUri?: string;
  method: 'sms' | 'authenticator' | 'passkey';
  phoneMasked?: string;
  currentCodePreview?: string; // Live code for instant validation
  expiresInSeconds?: number;
}

export interface AuthResponse {
  success: boolean;
  requires2FA?: boolean;
  twoFactorMethod?: 'sms' | 'authenticator' | 'passkey';
  tempToken?: string;
  resetToken?: string;
  demoCode?: string;
  smsPreviewCode?: string;
  phonePreview?: string;
  backupCodes?: string[];
  user?: CitizenUser;
  token?: string;
  error?: string;
  message?: string;
  recoveryKey?: string;
  auditEvents?: SecurityAuditEvent[];
}
