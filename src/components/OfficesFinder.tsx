import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Calendar, 
  Phone, 
  ExternalLink, 
  Navigation, 
  Search, 
  Filter, 
  CheckCircle2, 
  Compass, 
  AlertCircle 
} from 'lucide-react';
import { fetchOfficesApi } from '../services/apiClient.js';
import { GovernmentOffice } from '../types.js';

interface OfficesFinderProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
}

export const OfficesFinder: React.FC<OfficesFinderProps> = ({ currentCity, onSelectCity }) => {
  const [offices, setOffices] = useState<GovernmentOffice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoLocating, setGeoLocating] = useState(false);

  const categories = [
    'All',
    'Civic Municipal',
    'Identity Services',
    'Disaster & Emergency',
    'Grievance & Legal',
    'Revenue & Land',
    'Transport & RTO'
  ];

  useEffect(() => {
    loadOffices();
  }, [currentCity, selectedCategory]);

  const loadOffices = async () => {
    setLoading(true);
    try {
      const data = await fetchOfficesApi({
        city: currentCity,
        category: selectedCategory,
        search: searchQuery,
        latitude: userCoords?.latitude,
        longitude: userCoords?.longitude
      });
      setOffices(data);
    } catch (err) {
      console.error('Failed to load offices', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setGeoLocating(false);
        // Reload offices with distance calculations
        fetchOfficesApi({
          city: currentCity,
          category: selectedCategory,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }).then(setOffices);
      },
      (err) => {
        console.warn('Geolocation denied or timed out:', err);
        setGeoLocating(false);
        alert('Could not retrieve exact GPS coordinates. Displaying jurisdiction based on ' + currentCity);
      },
      { timeout: 8000 }
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOffices();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 text-xs font-bold mb-2">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              Verified Civic Infrastructure Directory
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Nearby Government Offices & Help Desks
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Official municipal offices, Aadhaar Seva Kendras, RTOs, and disaster centres. Real-time Open/Closed calculations, verified physical addresses, and direct navigation links.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDetectGPS}
              disabled={geoLocating}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Navigation className={`w-3.5 h-3.5 text-teal-400 ${geoLocating ? 'animate-spin' : ''}`} />
              <span>{geoLocating ? 'Detecting GPS...' : 'Use My Exact Location'}</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by office name, department, address, or service..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-slate-50/50"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition-colors"
            >
              Search
            </button>
          </form>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-purple-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Office Cards List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-mono text-xs">
          Calculating office timings and nearby distances...
        </div>
      ) : offices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <p className="text-slate-700 text-sm font-semibold mb-2">
            No matching government offices found in {currentCity}.
          </p>
          <p className="text-slate-400 text-xs mb-4">
            Try switching jurisdiction or resetting your search terms.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            Show All Offices
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {offices.map((off) => (
            <div
              key={off.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-purple-300 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 mr-2">
                      {off.category}
                    </span>
                    {off.distanceKm !== undefined && (
                      <span className="text-[10px] font-bold font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {off.distanceKm} km away
                      </span>
                    )}
                  </div>

                  {/* Live Open / Closed indicator badge */}
                  <div>
                    {off.isOpenNow ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Open Now
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Closed
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 mb-1">
                  {off.name}
                </h3>
                <p className="text-xs text-purple-800 font-semibold mb-3">
                  {off.department}
                </p>

                <p className="text-xs text-slate-600 flex items-start gap-1.5 mb-3 leading-relaxed">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{off.address}</span>
                </p>

                {/* Timings and details */}
                <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span><strong>Hours:</strong> {off.openingHours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span><strong>Closed:</strong> {off.closedDays.join(', ') || 'Open All Days'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span><strong>Phone:</strong> {off.phone}</span>
                  </div>
                </div>

                {/* Handled Services Tags */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Services Handled On-Site:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {off.services.map((s, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions: Directions & Call */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${off.phone.replace(/[^0-9]/g, '')}`}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  <span>Call Office</span>
                </a>

                <a
                  href={off.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Navigation className="w-3.5 h-3.5 text-teal-400" />
                  <span>Get Directions</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
