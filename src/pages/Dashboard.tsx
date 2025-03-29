import React, { useState, useEffect } from 'react';
import { Calendar, Users, Award, Layout, LogOut, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location: string;
  max_participants: number;
  community_id: string;
  created_by: string;
}

interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  registration_status: string;
  registered_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

function Dashboard() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>('user');
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: '',
    start_date: '',
    end_date: '',
    location: '',
    max_participants: 0,
  });

  useEffect(() => {
    async function getUserRole() {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (!error && data) {
        setUserRole(data.role);
      }
    }

    if (user) {
      getUserRole();
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
  };

  const fetchParticipants = async (eventId: string) => {
    const { data, error } = await supabase
      .from('event_participants')
      .select(`
        *,
        profiles (
          full_name,
          email
        )
      `)
      .eq('event_id', eventId);

    if (!error && data) {
      setParticipants(data);
      setSelectedEvent(eventId);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('events')
      .insert([
        {
          ...eventForm,
          created_by: user?.id,
        },
      ]);

    if (!error) {
      setShowEventForm(false);
      setEventForm({
        title: '',
        description: '',
        event_type: '',
        start_date: '',
        end_date: '',
        location: '',
        max_participants: 0,
      });
      fetchEvents();
    }
  };

  const handleRegisterEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('event_participants')
      .insert([
        {
          event_id: eventId,
          user_id: user?.id,
          registration_status: 'registered',
        },
      ]);

    if (!error) {
      fetchEvents();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const isRegistered = (eventId: string) => {
    return participants.some(p => p.event_id === eventId && p.user_id === user?.id);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="neo-card mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">College Event Hub</h1>
            <button className="neo-button flex items-center" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
              <span className="ml-2">Sign Out</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="neo-card">
            <nav className="space-y-4">
              <a href="#" className="flex items-center space-x-3 text-gray-700 hover:text-gray-900">
                <Layout className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              {(userRole === 'super_admin' || userRole === 'admin') && (
                <a href="#" className="flex items-center space-x-3 text-gray-700 hover:text-gray-900">
                  <Calendar className="w-5 h-5" />
                  <span>Manage Events</span>
                </a>
              )}
              <a href="#" className="flex items-center space-x-3 text-gray-700 hover:text-gray-900">
                <Award className="w-5 h-5" />
                <span>My Events</span>
              </a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-8">
            {/* Admin Event Management */}
            {(userRole === 'super_admin' || userRole === 'admin') && (
              <div className="neo-card">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Manage Events</h2>
                  <button
                    className="neo-button flex items-center"
                    onClick={() => setShowEventForm(!showEventForm)}
                  >
                    <Plus className="w-5 h-5" />
                    <span className="ml-2">Create Event</span>
                  </button>
                </div>

                {showEventForm && (
                  <form onSubmit={handleCreateEvent} className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Event Title"
                        className="neo-input"
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Event Type"
                        className="neo-input"
                        value={eventForm.event_type}
                        onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                        required
                      />
                      <input
                        type="datetime-local"
                        className="neo-input"
                        value={eventForm.start_date}
                        onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                        required
                      />
                      <input
                        type="datetime-local"
                        className="neo-input"
                        value={eventForm.end_date}
                        onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        className="neo-input"
                        value={eventForm.location}
                        onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Max Participants"
                        className="neo-input"
                        value={eventForm.max_participants}
                        onChange={(e) => setEventForm({ ...eventForm, max_participants: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <textarea
                      placeholder="Event Description"
                      className="neo-input w-full"
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      required
                    />
                    <button type="submit" className="neo-button">
                      Create Event
                    </button>
                  </form>
                )}

                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="neo-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
                          <p className="text-gray-600">
                            {new Date(event.start_date).toLocaleDateString()} • {event.location}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">{event.description}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="neo-button"
                            onClick={() => fetchParticipants(event.id)}
                          >
                            <Users className="w-5 h-5" />
                          </button>
                          <button className="neo-button">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button className="neo-button text-red-500">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {selectedEvent === event.id && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Registered Participants</h4>
                          <div className="space-y-2">
                            {participants.map((participant) => (
                              <div key={participant.id} className="neo-card">
                                <p>{participant.profiles.full_name || participant.profiles.email}</p>
                                <p className="text-sm text-gray-500">
                                  Registered: {new Date(participant.registered_at).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Event List */}
            {userRole === 'user' && (
              <div className="neo-card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Available Events</h2>
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="neo-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
                          <p className="text-gray-600">
                            {new Date(event.start_date).toLocaleDateString()} • {event.location}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">{event.description}</p>
                        </div>
                        <button
                          className={`neo-button ${isRegistered(event.id) ? 'bg-green-100' : ''}`}
                          onClick={() => handleRegisterEvent(event.id)}
                          disabled={isRegistered(event.id)}
                        >
                          {isRegistered(event.id) ? 'Registered' : 'Register'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;