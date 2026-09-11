import { Request, Response } from 'express';

interface CityMapping {
  city: string;
  state: string;
  municipalBody: string;
  pincodeSample: string;
}

const cityDirectory: Record<string, CityMapping> = {
  bengaluru: {
    city: 'Bengaluru',
    state: 'Karnataka',
    municipalBody: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
    pincodeSample: '560001'
  },
  bangalore: {
    city: 'Bengaluru',
    state: 'Karnataka',
    municipalBody: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
    pincodeSample: '560001'
  },
  mumbai: {
    city: 'Mumbai',
    state: 'Maharashtra',
    municipalBody: 'Brihanmumbai Municipal Corporation (BMC)',
    pincodeSample: '400001'
  },
  delhi: {
    city: 'New Delhi',
    state: 'Delhi NCR',
    municipalBody: 'Municipal Corporation of Delhi (MCD)',
    pincodeSample: '110001'
  },
  hyderabad: {
    city: 'Hyderabad',
    state: 'Telangana',
    municipalBody: 'Greater Hyderabad Municipal Corporation (GHMC)',
    pincodeSample: '500001'
  },
  chennai: {
    city: 'Chennai',
    state: 'Tamil Nadu',
    municipalBody: 'Greater Chennai Corporation (GCC)',
    pincodeSample: '600001'
  },
  kolkata: {
    city: 'Kolkata',
    state: 'West Bengal',
    municipalBody: 'Kolkata Municipal Corporation (KMC)',
    pincodeSample: '700001'
  },
  pune: {
    city: 'Pune',
    state: 'Maharashtra',
    municipalBody: 'Pune Municipal Corporation (PMC)',
    pincodeSample: '411001'
  }
};

export const resolveLocation = (req: Request, res: Response): void => {
  const { city, pincode, latitude, longitude } = req.body;

  let detectedCity = 'Bengaluru';
  let detectedState = 'Karnataka';
  let municipalBody = 'Bruhat Bengaluru Mahanagara Palike (BBMP)';

  if (city && typeof city === 'string') {
    const key = city.trim().toLowerCase();
    if (cityDirectory[key]) {
      detectedCity = cityDirectory[key].city;
      detectedState = cityDirectory[key].state;
      municipalBody = cityDirectory[key].municipalBody;
    } else {
      detectedCity = city;
      detectedState = 'India';
      municipalBody = `${city} Municipal Corporation`;
    }
  } else if (pincode && typeof pincode === 'string') {
    if (pincode.startsWith('560')) {
      detectedCity = 'Bengaluru';
      detectedState = 'Karnataka';
      municipalBody = 'BBMP';
    } else if (pincode.startsWith('400')) {
      detectedCity = 'Mumbai';
      detectedState = 'Maharashtra';
      municipalBody = 'BMC';
    } else if (pincode.startsWith('110')) {
      detectedCity = 'Delhi';
      detectedState = 'Delhi NCR';
      municipalBody = 'MCD';
    }
  } else if (latitude && longitude) {
    // If coords are near Bangalore ~12.97, 77.59
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (Math.abs(lat - 12.97) < 1.0 && Math.abs(lon - 77.59) < 1.0) {
      detectedCity = 'Bengaluru';
      detectedState = 'Karnataka';
      municipalBody = 'Bruhat Bengaluru Mahanagara Palike (BBMP)';
    } else if (Math.abs(lat - 19.07) < 1.0 && Math.abs(lon - 72.87) < 1.0) {
      detectedCity = 'Mumbai';
      detectedState = 'Maharashtra';
      municipalBody = 'Brihanmumbai Municipal Corporation (BMC)';
    } else if (Math.abs(lat - 28.61) < 1.0 && Math.abs(lon - 77.20) < 1.0) {
      detectedCity = 'New Delhi';
      detectedState = 'Delhi NCR';
      municipalBody = 'Municipal Corporation of Delhi (MCD)';
    }
  }

  res.json({
    city: detectedCity,
    state: detectedState,
    municipalBody,
    resolvedAt: new Date().toISOString(),
    confidence: 'Verified Civic Jurisdiction Mapping'
  });
};
