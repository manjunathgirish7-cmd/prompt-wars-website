import { GovernmentService } from '../../src/types.js';

export const verifiedServices: GovernmentService[] = [
  {
    id: 'srv-aadhaar-update',
    name: 'Aadhaar Demographic & Biometric Update',
    category: 'Identity & Civil Documents',
    description: 'Correction and update of Name, Address, Date of Birth, Gender, Mobile Number, Email, and Biometrics in Aadhaar.',
    level: 'Central',
    officialWebsite: 'https://myaadhaar.uidai.gov.in',
    portalName: 'myAadhaar Portal (UIDAI)',
    helplinePhone: '1947',
    email: 'help@uidai.gov.in',
    requiredDocuments: [
      { id: 'doc-1', name: 'Proof of Address (POA)', description: 'Electricity bill, Water bill, Bank Statement, Rent agreement, or Passport', mandatory: true },
      { id: 'doc-2', name: 'Proof of Identity (POI)', description: 'PAN card, Voter ID, Passport, or Driving License', mandatory: true },
      { id: 'doc-3', name: 'Proof of Date of Birth (DOB)', description: 'Birth Certificate or 10th Standard Marksheet', mandatory: false }
    ],
    procedures: [
      { step: 1, title: 'Check Online Eligibility', instruction: 'Address update can be done online at myaadhaar.uidai.gov.in with registered mobile OTP.' },
      { step: 2, title: 'Book Appointment for Biometrics', instruction: 'Mobile number, photo, iris, and fingerprint updates require an in-person visit to an Aadhaar Seva Kendra (ASK).' },
      { step: 3, title: 'Track Status with URN', instruction: 'Use the 14-digit Update Request Number (URN) to track update status within 5 to 15 days.' }
    ],
    sources: ['https://uidai.gov.in', 'https://myaadhaar.uidai.gov.in'],
    lastVerified: '2026-09-01T00:00:00Z',
    turnaroundTime: '5-15 working days',
    feeStructure: '₹50 for demographic update, ₹100 for biometric update'
  },
  {
    id: 'srv-pothole-road',
    name: 'Municipal Road Hazard & Pothole Repair Complaint',
    category: 'Civic Infrastructure',
    description: 'Lodging grievance for dangerous potholes, damaged asphalt, open manholes, or cave-ins on public city roads.',
    level: 'Municipal',
    officialWebsite: 'https://bbmp.gov.in',
    portalName: 'FixMyStreet / Citizen Grievance Portal',
    helplinePhone: '1533',
    email: 'contactusbbmp@gmail.com',
    requiredDocuments: [
      { id: 'doc-pothole-1', name: 'Geotagged Photo of Pothole/Hazard', description: 'Clear photo showing depth and road context', mandatory: true },
      { id: 'doc-pothole-2', name: 'Exact Landmark / GPS Coordinates', description: 'Street name, cross road, nearest shop or landmark', mandatory: true }
    ],
    procedures: [
      { step: 1, title: 'Document the Danger', instruction: 'Capture 1-2 photos of the road depression and note the nearest visible street pole or building landmark.' },
      { step: 2, title: 'File via Municipal Citizen App or Portal', instruction: 'Submit complaint under "Road Infrastructure / Pothole" category on the municipal portal or helpline 1533.' },
      { step: 3, title: 'Receive Docket Number & SLA', instruction: 'Citizen Charter mandates inspection within 48 hours and asphalt patchwork within 72 hours for major arterial roads.' }
    ],
    sources: ['https://bbmp.gov.in', 'https://cpgrams-portal.gov.in'],
    lastVerified: '2026-09-05T00:00:00Z',
    turnaroundTime: '48 to 72 hours (Safety Critical)',
    feeStructure: 'Free of Cost (Public Service)'
  },
  {
    id: 'srv-urban-flood-drain',
    name: 'Stormwater Inundation & Emergency Flood Response',
    category: 'Disaster & Emergency',
    description: 'Rapid response for street waterlogging, overflowing stormwater drains (Rajakaluve), residential inundation, and fallen tree hazards during monsoons.',
    level: 'Municipal',
    officialWebsite: 'https://ndma.gov.in',
    portalName: 'Disaster Management Cell & Municipal Control Room',
    helplinePhone: '112 / 1070',
    email: 'controlroom@disastermanagement.gov.in',
    requiredDocuments: [
      { id: 'doc-flood-1', name: 'Location & Severity Description', description: 'Water level (ankle, knee, or waist high), trapped individuals, electricity risks', mandatory: true }
    ],
    procedures: [
      { step: 1, title: 'Ensure Immediate Life Safety', instruction: 'Turn off household main electrical switch (MCB) and move vulnerable persons to higher ground.' },
      { step: 2, title: 'Call Emergency Disaster Line 112 / 1070', instruction: 'State clearly: "Water entering homes / severe road flooding at [Area Name]".' },
      { step: 3, title: 'Municipal Pumping & Dewatering Team Dispatch', instruction: 'Quick Response Team (QRT) deploys mobile high-capacity dewatering pumps and clears blocked culverts.' }
    ],
    sources: ['https://ndma.gov.in', 'https://sdma.karnataka.gov.in'],
    lastVerified: '2026-09-08T00:00:00Z',
    turnaroundTime: 'Immediate (Within 30-60 mins for life safety)',
    feeStructure: 'Free Public Emergency Service'
  },
  {
    id: 'srv-driving-licence-renew',
    name: 'Driving Licence Renewal & Address Change',
    category: 'Transport & Licensing',
    description: 'Online application for renewal of expired Driving Licence (DL), duplicate DL, or change of residential address.',
    level: 'State',
    officialWebsite: 'https://parivahan.gov.in/parivahan',
    portalName: 'Sarathi Parivahan (MoRTH)',
    helplinePhone: '0120-4925505',
    email: 'helpdesk-sarathi@gov.in',
    requiredDocuments: [
      { id: 'doc-dl-1', name: 'Original Expired Driving Licence', description: 'Physical card or DigiLocker copy', mandatory: true },
      { id: 'doc-dl-2', name: 'Medical Certificate (Form 1A)', description: 'Mandatory if applicant is over 40 years old or for transport vehicles', mandatory: false },
      { id: 'doc-dl-3', name: 'Proof of Address', description: 'Aadhaar card or utility bill if changing address', mandatory: false }
    ],
    procedures: [
      { step: 1, title: 'Fill Form Online on Sarathi', instruction: 'Navigate to parivahan.gov.in -> Online Services -> Driving License Related Services -> Apply for DL Renewal.' },
      { step: 2, title: 'Upload Documents & Form 1A', instruction: 'Upload self-attested documents and certified Form 1A by a registered medical practitioner.' },
      { step: 3, title: 'Pay Fee & Download Acknowledgement', instruction: 'Pay prescribed RTO fee online. Physical smart card dispatched via Speed Post.' }
    ],
    sources: ['https://parivahan.gov.in'],
    lastVerified: '2026-08-28T00:00:00Z',
    turnaroundTime: '7-14 working days',
    feeStructure: '₹200 for Renewal + ₹200 for Smart Card + Speed Post ₹50'
  },
  {
    id: 'srv-water-leak-contamination',
    name: 'Public Water Supply Contamination & Pipe Burst',
    category: 'Water & Sanitation',
    description: 'Reporting drinking water pipe burst, contaminated/muddy tap water supply, low pressure, or sewage mixing.',
    level: 'Municipal',
    officialWebsite: 'https://bwssb.karnataka.gov.in',
    portalName: 'Water Supply & Sewerage Board Grievance Portal',
    helplinePhone: '1916',
    email: 'watergrievance@bwssb.gov.in',
    requiredDocuments: [
      { id: 'doc-water-1', name: 'Consumer / RR Number (Optional)', description: 'Consumer number on your water bill if reporting residential supply', mandatory: false },
      { id: 'doc-water-2', name: 'Exact Street Location', description: 'Street address where pipe burst or contamination is occurring', mandatory: true }
    ],
    procedures: [
      { step: 1, title: 'Register Grievance via 1916 or Web', instruction: 'State whether it is a mainline burst on the road or contaminated supply to homes.' },
      { step: 2, title: 'Assistant Executive Engineer (AEE) Inspection', instruction: 'Ward maintenance valve operator inspects supply valve and collects water samples.' },
      { step: 3, title: 'Repair and Water Quality Test', instruction: 'Pipeline welded or replaced, chlorinated flush performed.' }
    ],
    sources: ['https://bwssb.karnataka.gov.in', 'https://jaljeevanmission.gov.in'],
    lastVerified: '2026-09-02T00:00:00Z',
    turnaroundTime: '24 hours for pipe burst, 48 hours for contamination',
    feeStructure: 'Free of Cost for Public Infrastructure'
  },
  {
    id: 'srv-electricity-hazard',
    name: 'Power Outage, Low Voltage & Loose Live Wire Hazard',
    category: 'Utilities & Electricity',
    description: 'Reporting fallen power lines, transformer sparks, electrocution risks, billing errors, or unscheduled long power cuts.',
    level: 'State',
    officialWebsite: 'https://bescom.karnataka.gov.in',
    portalName: 'Electricity Distribution Company (DISCOM) 24x7 Helpline',
    helplinePhone: '1912',
    email: 'helpline@bescom.co.in',
    requiredDocuments: [
      { id: 'doc-elec-1', name: 'Consumer Account ID / Meter Number', description: '10-digit Account ID printed on monthly bill', mandatory: false },
      { id: 'doc-elec-2', name: 'Location of Hazard / Pole Number', description: 'Nearby transformer number or street pole paint code', mandatory: true }
    ],
    procedures: [
      { step: 1, title: 'Live Wire Caution', instruction: 'DO NOT approach fallen wires (maintain minimum 10 meters distance). Call 1912 immediately.' },
      { step: 2, title: 'Station Line Disconnection', instruction: 'Substation staff isolates feeder line immediately upon receiving live hazard alert.' },
      { step: 3, title: 'Lineman Field Rectification', instruction: 'Gangmen and section engineer repair transformer fuse or restock jumper line.' }
    ],
    sources: ['https://bescom.karnataka.gov.in', 'https://powermin.gov.in'],
    lastVerified: '2026-09-07T00:00:00Z',
    turnaroundTime: 'Immediate for sparking/live wire; 2 hours for urban outage',
    feeStructure: 'Free Emergency Service'
  },
  {
    id: 'srv-cpgrams-grievance',
    name: 'Centralized Public Grievance Redress and Monitoring System (CPGRAMS)',
    category: 'Public Grievance',
    description: 'Apex portal of the Government of India for grievances related to any Central Ministry, Department, or Autonomous Body.',
    level: 'Central',
    officialWebsite: 'https://pgportal.gov.in',
    portalName: 'CPGRAMS Portal (DARPG)',
    helplinePhone: '1800-11-0031',
    email: 'cpgrams-darpg@nic.in',
    requiredDocuments: [
      { id: 'doc-cpg-1', name: 'Previous Reference / Complaint Numbers', description: 'Docket numbers of prior unresolved local complaints', mandatory: false },
      { id: 'doc-cpg-2', name: 'Supporting Evidence PDF', description: 'Photos, letters, receipts, or official notices received', mandatory: false }
    ],
    procedures: [
      { step: 1, title: 'Register Citizen Account', instruction: 'Sign in with Mobile / Email on pgportal.gov.in.' },
      { step: 2, title: 'Select Ministry or Department', instruction: 'Choose appropriate department (e.g., Telecom, Railways, Banking, Pensions, Road Transport).' },
      { step: 3, title: 'Escalation to Nodal Officer', instruction: 'Complaint forwarded directly to Director of Grievances with statutory 21-30 days resolution mandate.' }
    ],
    sources: ['https://pgportal.gov.in', 'https://darpg.gov.in'],
    lastVerified: '2026-09-04T00:00:00Z',
    turnaroundTime: 'Statutory 21-30 days',
    feeStructure: 'Free Public Grievance Service'
  },
  {
    id: 'srv-birth-death-cert',
    name: 'Birth & Death Certificate Issuance and Corrections',
    category: 'Identity & Civil Documents',
    description: 'Registration and official certified copy issuance of Birth and Death under Registration of Births and Deaths Act.',
    level: 'Municipal',
    officialWebsite: 'https://crsorgi.gov.in',
    portalName: 'Civil Registration System (CRS / e-JanMa)',
    helplinePhone: '080-22660000',
    email: 'crs-helpdesk@nic.in',
    requiredDocuments: [
      { id: 'doc-bd-1', name: 'Hospital Discharge Summary / Form 2 or Form 4A', description: 'Institutional delivery slip or medical cert of cause of death', mandatory: true },
      { id: 'doc-bd-2', name: 'Parents / Informant ID Proof', description: 'Aadhaar card of parents or informant', mandatory: true }
    ],
    procedures: [
      { step: 1, title: 'Hospital Automatic Reporting', instruction: 'Hospitals register events within 21 days on crsorgi.gov.in.' },
      { step: 2, title: 'Apply for Digitally Signed Copy', instruction: 'Download digitally signed QR-coded certificate from state citizen portal.' },
      { step: 3, title: 'Correction at Ward Registrar', instruction: 'Name corrections require affidavit and sub-registrar verification.' }
    ],
    sources: ['https://crsorgi.gov.in'],
    lastVerified: '2026-08-30T00:00:00Z',
    turnaroundTime: 'Instant download if registered, 7 days for delayed registration',
    feeStructure: 'Free within 21 days; ₹5-₹20 late search fee thereafter'
  }
];
