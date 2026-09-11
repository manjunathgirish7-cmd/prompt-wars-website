import { Request, Response } from 'express';
import { verifiedServices } from '../data/servicesData.js';

export const getAllServices = (req: Request, res: Response): void => {
  const { category, search } = req.query;

  let results = [...verifiedServices];

  if (category && typeof category === 'string' && category !== 'All') {
    results = results.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase();
    results = results.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.portalName.toLowerCase().includes(q)
    );
  }

  res.json(results);
};

export const getServiceById = (req: Request, res: Response): void => {
  const { id } = req.params;
  const service = verifiedServices.find(s => s.id === id);

  if (!service) {
    res.status(404).json({ error: 'Government service not found' });
    return;
  }

  res.json(service);
};
