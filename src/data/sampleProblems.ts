export interface DemoScenario {
  id: string;
  title: string;
  badge: string;
  prompt: string;
  category: string;
  location: string;
  description: string;
  hasSampleImage?: boolean;
  sampleImageName?: string;
  sampleImageData?: string; // base64 SVG or image data URL
}

// Clean realistic demo image placeholders (data URLs) for 1-click test
const POTHOLE_IMG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23334155"/><path d="M50 350 L550 350 L500 150 L100 150 Z" fill="%231e293b"/><ellipse cx="300" cy="270" rx="140" ry="60" fill="%230f172a"/><path d="M220 250 Q280 290 380 260 Q340 310 240 280 Z" fill="%23020617"/><text x="300" y="70" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23f8fafc" text-anchor="middle">Civic Hazard: Deep Arterial Road Pothole</text><text x="300" y="105" font-family="sans-serif" font-size="14" fill="%23cbd5e1" text-anchor="middle">Geo-tag: 12.9784 N, 77.6408 E (Mayo Hall Road)</text><line x1="200" y1="270" x2="400" y2="270" stroke="%23f59e0b" stroke-width="3" stroke-dasharray="6"/></svg>`;

const FLOOD_IMG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f172a"/><path d="M0 220 C150 200 300 240 450 210 C520 195 570 230 600 220 L600 400 L0 400 Z" fill="%230284c7"/><path d="M0 270 C120 250 350 290 500 260 L600 280 L600 400 L0 400 Z" fill="%230369a1"/><rect x="80" y="120" width="100" height="120" fill="%23475569"/><polygon points="80,120 130,70 180,120" fill="%23ef4444"/><rect x="400" y="140" width="120" height="100" fill="%23475569"/><polygon points="400,140 460,90 520,140" fill="%23ef4444"/><text x="300" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23f8fafc" text-anchor="middle">EMERGENCY: Monsoon Water Inundation</text><text x="300" y="80" font-family="sans-serif" font-size="14" fill="%23fca5a5" text-anchor="middle">Water Depth: 2.5 ft entering residential driveways</text></svg>`;

const NOTICE_IMG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f1f5f9"/><rect x="80" y="40" width="440" height="320" rx="8" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="300" y="85" font-family="sans-serif" font-size="16" font-weight="bold" fill="%231e293b" text-anchor="middle">OFFICIAL GOVERNMENT NOTICE</text><text x="300" y="110" font-family="sans-serif" font-size="12" fill="%2364748b" text-anchor="middle">Department of Revenue & Municipal Assessment</text><line x1="120" y1="130" x2="480" y2="130" stroke="%23e2e8f0" stroke-width="2"/><rect x="120" y="150" width="300" height="12" rx="3" fill="%2394a3b8"/><rect x="120" y="175" width="340" height="12" rx="3" fill="%23cbd5e1"/><rect x="120" y="200" width="280" height="12" rx="3" fill="%23cbd5e1"/><rect x="120" y="235" width="180" height="24" rx="4" fill="%23fef3c7" stroke="%23f59e0b"/><text x="210" y="252" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23b45309" text-anchor="middle">Reply Deadline: 15 Days</text></svg>`;

export const demoScenarios: DemoScenario[] = [
  {
    id: 'demo-pothole',
    title: 'Dangerous Road Pothole',
    badge: 'Civic Infrastructure',
    category: 'Civic Infrastructure',
    location: 'Indiranagar 100ft Road, Bengaluru',
    prompt: 'This pothole is dangerous and nobody is fixing it. Two people nearly fell off their scooters yesterday.',
    description: 'Civic hazard on arterial road. Demonstrates photo analysis, BBMP civic mapping, and formal complaint generation.',
    hasSampleImage: true,
    sampleImageName: 'pothole_evidence.png',
    sampleImageData: POTHOLE_IMG
  },
  {
    id: 'demo-flood',
    title: 'Monsoon Flooding Emergency',
    badge: 'Disaster & Emergency',
    category: 'Disaster & Emergency',
    location: 'HSR Layout Sector 6, Bengaluru',
    prompt: 'There is severe flooding near my house, water is rising above knee level and entering the front gate. I don’t know who to contact!',
    description: 'Activates Emergency Mode, verified disaster helpline 112 / 1070, and rapid dewatering pump team dispatch.',
    hasSampleImage: true,
    sampleImageName: 'residential_flooding.png',
    sampleImageData: FLOOD_IMG
  },
  {
    id: 'demo-aadhaar',
    title: 'Aadhaar Update Assistance',
    badge: 'Identity & Documents',
    category: 'Identity & Civil Documents',
    location: 'Bengaluru Central',
    prompt: 'I moved to a new house and need to update my Aadhaar address and link my new phone number, but I don’t know where to go or what papers to carry.',
    description: 'Distinguishes online self-service (address) from mandatory in-person ASK biometric visit (mobile).',
    hasSampleImage: false
  },
  {
    id: 'demo-notice',
    title: 'Government Notice Clarification',
    badge: 'Public Grievance',
    category: 'Public Grievance',
    location: 'City Municipal Ward',
    prompt: 'I received this government notice about property tax reassessment and penalty demand, but the legal language is confusing and I have only 15 days left.',
    description: 'Demystifies legal terms, explains citizen appeal rights under the municipal act, and provides a formal reply letter.',
    hasSampleImage: true,
    sampleImageName: 'tax_reassessment_notice.png',
    sampleImageData: NOTICE_IMG
  }
];
