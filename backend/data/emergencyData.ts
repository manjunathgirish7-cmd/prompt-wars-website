import { EmergencyContact, OfficialSourceItem } from '../../src/types.js';

export const verifiedEmergencyContacts: EmergencyContact[] = [
  {
    id: 'emg-112',
    name: 'National Unified Emergency Helpline (ERSS)',
    number: '112',
    category: 'National Emergency',
    description: 'Unified single number for Police, Fire, Ambulance, and Disaster response across all states.',
    availableHours: '24x7 / Toll-Free',
    verifiedOfficial: true,
    source: 'Ministry of Home Affairs (MHA), GoI',
    actionGuideline: 'State your location clearly, type of hazard, and if anyone is in imminent danger.'
  },
  {
    id: 'emg-1070',
    name: 'State Disaster Management Control Room',
    number: '1070',
    category: 'Disaster Management',
    description: 'Direct line to State Emergency Operations Centre for floods, building collapse, cyclones, and landslides.',
    availableHours: '24x7 / Toll-Free',
    verifiedOfficial: true,
    source: 'National Disaster Management Authority (NDMA)',
    actionGuideline: 'Report water levels, trapped residents, or breaches in embankments/lakes.'
  },
  {
    id: 'emg-1077',
    name: 'District Disaster Emergency Line',
    number: '1077',
    category: 'Disaster Management',
    description: 'Connects directly to the District Collector / Deputy Commissioner Disaster Cell.',
    availableHours: '24x7 / Toll-Free',
    verifiedOfficial: true,
    source: 'District Administration Directory',
    actionGuideline: 'Use for local inundation, relief camp coordination, and boat dispatch.'
  },
  {
    id: 'emg-101',
    name: 'Fire & Emergency Rescue Services',
    number: '101',
    category: 'Fire',
    description: 'Fire control room, technical rescue, building evacuation, and hazardous chemical spills.',
    availableHours: '24x7 / Toll-Free',
    verifiedOfficial: true,
    source: 'Directorate of Fire and Emergency Services',
    actionGuideline: 'Clear access roads for fire engines and turn off domestic gas and electric mains.'
  },
  {
    id: 'emg-108',
    name: 'Emergency Medical & Ambulance Service',
    number: '108',
    category: 'Medical',
    description: 'Advanced life support (ALS) and basic life support (BLS) ambulances for critical medical emergencies.',
    availableHours: '24x7 / Toll-Free',
    verifiedOfficial: true,
    source: 'National Health Mission (NHM)',
    actionGuideline: 'Keep caller phone available for GPS tracking and paramedic triage instructions.'
  },
  {
    id: 'emg-1912',
    name: 'Electrical Hazard & Live Wire Emergency',
    number: '1912',
    category: 'Civic Emergency',
    description: 'Immediate line disconnection for fallen live conductors, transformer sparks, or electric poles underwater.',
    availableHours: '24x7 / Toll-Free',
    verifiedOfficial: true,
    source: 'Central Electricity Authority / State DISCOMs',
    actionGuideline: 'Cordon off area 10 meters around fallen conductor. Warn passersby.'
  },
  {
    id: 'emg-1916',
    name: 'Municipal Flood & Water Main Burst Control',
    number: '1916',
    category: 'Civic Emergency',
    description: 'Municipal control room for water main breaches, contaminated supply, and stormwater drain blockages.',
    availableHours: '24x7 / Toll-Free',
    verifiedOfficial: true,
    source: 'Ministry of Housing and Urban Affairs (MoHUA)',
    actionGuideline: 'Provide exact street name and landmark for rapid municipal valve team dispatch.'
  },
  {
    id: 'emg-181',
    name: 'Women in Distress National Helpline',
    number: '181',
    category: 'Women & Child',
    description: 'Support, shelter referral, and legal assistance for women facing safety threats or harassment.',
    availableHours: '24x7 / Toll-Free',
    verifiedOfficial: true,
    source: 'Ministry of Women and Child Development',
    actionGuideline: 'Confidential counseling and rapid police escort dispatched if immediate danger exists.'
  }
];

export const verifiedSourcesRegistry: OfficialSourceItem[] = [
  {
    name: 'UIDAI - Unique Identification Authority of India',
    url: 'https://uidai.gov.in',
    verified: true,
    lastChecked: '2026-09-01T00:00:00Z',
    sourceType: 'Government Portal',
    authority: 'Ministry of Electronics and Information Technology (MeitY)',
    notes: 'Official repository for Aadhaar regulations, fee schedules, and Seva Kendra locations.'
  },
  {
    name: 'Sarathi Parivahan - Ministry of Road Transport and Highways',
    url: 'https://parivahan.gov.in',
    verified: true,
    lastChecked: '2026-08-28T00:00:00Z',
    sourceType: 'Government Portal',
    authority: 'Ministry of Road Transport and Highways (MoRTH)',
    notes: 'National portal for vehicle registration, driving licences, and RTO rules.'
  },
  {
    name: 'CPGRAMS - Department of Administrative Reforms and Public Grievances',
    url: 'https://pgportal.gov.in',
    verified: true,
    lastChecked: '2026-09-04T00:00:00Z',
    sourceType: 'Government Portal',
    authority: 'Department of Administrative Reforms and Public Grievances (DARPG)',
    notes: 'Centralized government citizen grievance redressal platform with statutory escalation.'
  },
  {
    name: 'NDMA - National Disaster Management Authority',
    url: 'https://ndma.gov.in',
    verified: true,
    lastChecked: '2026-09-08T00:00:00Z',
    sourceType: 'Emergency Directorate',
    authority: 'Ministry of Home Affairs, Government of India',
    notes: 'Standard Operating Procedures for urban floods, cyclones, landslides, and seismic events.'
  },
  {
    name: 'National Portal of India (india.gov.in)',
    url: 'https://www.india.gov.in',
    verified: true,
    lastChecked: '2026-09-05T00:00:00Z',
    sourceType: 'Citizen Charter',
    authority: 'National Informatics Centre (NIC)',
    notes: 'Single-window access to information and services being provided by the various Indian Government entities.'
  }
];
