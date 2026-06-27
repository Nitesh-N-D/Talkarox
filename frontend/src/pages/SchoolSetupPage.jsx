import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, School, Plus, MapPin } from 'lucide-react';
import debounce from 'lodash/debounce';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import { Input } from '../components/common/Primitives';
import Button from '../components/common/Button';
import { Card } from '../components/common/Primitives';
import { searchSchools, registerSchool } from '../services/api';

export default function SchoolSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');
  const [creating, setCreating] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (q) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const { data } = await searchSchools(q);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const selectSchool = (school) => {
    navigate('/onboarding/profile', { state: { role, schoolId: school.id, schoolName: school.name } });
  };

  const handleCreateSchool = async () => {
    if (!newSchoolName.trim()) {
      toast.error('Enter your school\u2019s name');
      return;
    }
    setCreating(true);
    try {
      const { data } = await registerSchool({ name: newSchoolName, address: newSchoolAddress });
      toast.success('School created!');
      navigate('/onboarding/profile', { state: { role, schoolId: data.id, schoolName: data.name } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not create school');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AuthLayout title="Find your school" subtitle="Search for your school, or create a new one if it\u2019s not listed yet.">
      <div className="space-y-4">
        {!showCreate ? (
          <>
            <Input
              icon={Search}
              placeholder="Start typing your school's name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />

            <div className="space-y-2 min-h-[120px]">
              {searching && (
                <div className="flex items-center gap-2 text-sm text-ink-faint py-3">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
                  Searching schools…
                </div>
              )}
              {!searching && query.length >= 2 && results.length === 0 && (
                <p className="text-sm text-ink-faint py-3">No school found matching "{query}".</p>
              )}
              {results.map((school) => (
                <motion.button
                  key={school.id}
                  whileHover={{ y: -1 }}
                  onClick={() => selectSchool(school)}
                  className="w-full flex items-center gap-3 p-3.5 bg-white border border-gray-200 rounded-card text-left hover:border-brand transition-all"
                >
                  <div className="w-10 h-10 rounded-card bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <School size={18} className="text-brand-600" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-ink truncate">{school.name}</p>
                    {school.address && (
                      <p className="text-xs text-ink-faint flex items-center gap-1 truncate">
                        <MapPin size={11} /> {school.address}
                      </p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-gray-300 rounded-card text-sm font-semibold text-ink-mute hover:border-brand hover:text-brand transition-colors"
            >
              <Plus size={16} /> My school isn't listed — create it
            </button>
          </>
        ) : (
          <Card className="space-y-4" padding="p-5">
            <Input label="School name" placeholder="Sunflower Public School" value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)} autoFocus />
            <Input label="Address (optional)" placeholder="Madurai, Tamil Nadu" value={newSchoolAddress} onChange={(e) => setNewSchoolAddress(e.target.value)} />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setShowCreate(false)} fullWidth>Back to search</Button>
              <Button onClick={handleCreateSchool} loading={creating} fullWidth>Create school</Button>
            </div>
          </Card>
        )}
      </div>
    </AuthLayout>
  );
}
