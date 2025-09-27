import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Calendar as CalendarIcon, Clock, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Database } from '../lib/supabase';

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'];

export default function Calendar() {
  const { profile, isAdmin } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    all_day: false,
  });

  useEffect(() => {
    fetchEvents();
  }, [profile, isAdmin]);

  const fetchEvents = async () => {
    try {
      if (isAdmin) {
        // For admins, show all calendar events
        const { data, error } = await supabase
          .from('calendar_events')
          .select('*')
          .order('start_date', { ascending: true });
        
        if (error) throw error;
        setEvents(data || []);
      } else {
        // For regular users, get both created calendar events and assigned temple events
        const [createdEventsRes, assignedEventsRes] = await Promise.all([
          supabase.from('calendar_events').select('*').eq('user_id', profile?.id).order('start_date', { ascending: true }),
          supabase.from('event_assignments').select('event_id').eq('user_id', profile?.id),
        ]);

        if (createdEventsRes.error) throw createdEventsRes.error;
        if (assignedEventsRes.error) throw assignedEventsRes.error;

        // Get assigned event IDs
        const assignedEventIds = assignedEventsRes.data?.map(assignment => assignment.event_id) || [];
        
        // Fetch assigned temple events and convert them to calendar events format
        let assignedEventsData = [];
        if (assignedEventIds.length > 0) {
          const templeEventsRes = await supabase
            .from('temple_events')
            .select('id, title, description, start_date, end_date, all_day, user_id, created_at, updated_at, is_recurring, parent_event_id')
            .in('id', assignedEventIds);
          
          if (templeEventsRes.data) {
            // Convert temple events to calendar events format
            assignedEventsData = templeEventsRes.data.map(event => ({
              id: `assigned_${event.id}`,
              title: event.title + (event.is_recurring ? ' (Recurring)' : ''),
              description: event.description || '',
              start_date: event.start_date,
              end_date: event.end_date,
              all_day: event.all_day || false,
              user_id: event.user_id,
              created_at: event.created_at,
              updated_at: event.updated_at,
              is_recurring: event.is_recurring,
              parent_event_id: event.parent_event_id,
            }));
          }
        }

        // Combine created calendar events and assigned temple events
        const allEvents = [
          ...(createdEventsRes.data || []),
          ...assignedEventsData
        ].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

        setEvents(allEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!formData.title.trim() || !formData.start_date) return;

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        all_day: formData.all_day,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('calendar_events')
          .insert({
            ...eventData,
            user_id: profile!.id,
          });

        if (error) throw error;
      }

      await fetchEvents();
      setShowEditor(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        all_day: false,
      });
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      start_date: new Date(event.start_date).toISOString().slice(0, 16),
      end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
      all_day: event.all_day,
    });
    setShowEditor(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      all_day: false,
    });
  };

  const formatEventDate = (startDate: string, endDate: string | null, allDay: boolean) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (allDay) {
      return `All day - ${start.toLocaleDateString()}`;
    }

    if (end && end.toDateString() !== start.toDateString()) {
      return `${start.toLocaleString()} - ${end.toLocaleString()}`;
    } else if (end) {
      return `${start.toLocaleDateString()} ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`;
    } else {
      return start.toLocaleString();
    }
  };

  const groupEventsByDate = (events: CalendarEvent[]) => {
    const groups: { [key: string]: CalendarEvent[] } = {};
    
    events.forEach(event => {
      const date = new Date(event.start_date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });

    return groups;
  };

  if (profile?.status !== 'approved') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            You need to be approved to access the calendar.
          </p>
        </div>
      </div>
    );
  }

  const eventGroups = groupEventsByDate(events);

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isAdmin ? 'All Calendar Events' : 'My Calendar'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            {isAdmin ? 'View all user calendar events' : 'Manage your calendar events and tasks'}
          </p>
        </div>
        
        {(!isAdmin || (isAdmin && profile?.id)) && (
          <button
            onClick={() => setShowEditor(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>New Event</span>
          </button>
        )}
      </div>

      {showEditor && (
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={handleSaveEvent}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter event description..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="start_date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  id="end_date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="all_day"
                  checked={formData.all_day}
                  onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="all_day" className="ml-2 text-sm text-gray-700">
                  All day event
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
          <p className="text-gray-600">
            Create your first event to get started with calendar management.
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {Object.entries(eventGroups).map(([date, dayEvents]) => (
            <div key={date} className="bg-white rounded-lg shadow-sm border">
              <div className="bg-gray-50 px-4 sm:px-6 py-3 border-b">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4">
                {dayEvents.map((event) => (
                  <div key={event.id} className="flex flex-col lg:flex-row lg:items-start lg:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors space-y-4 lg:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                        <h4 className="text-base sm:text-lg font-medium text-gray-900 truncate">{event.title}</h4>
                        {event.all_day && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full w-fit">
                            All Day
                          </span>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-sm sm:text-base text-gray-600 mb-2 break-words">{event.description}</p>
                      )}
                      
                      <div className="flex items-center text-xs sm:text-sm text-gray-500 space-x-2">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{formatEventDate(event.start_date, event.end_date, event.all_day)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center lg:justify-end space-x-2">
                      {/* Only show edit/delete for events created by the user, not assigned events */}
                      {(!isAdmin || event.user_id === profile?.id) && !event.id.startsWith('assigned_') && (
                        <>
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Event"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {/* Show indicator for assigned events */}
                      {event.id.startsWith('assigned_') && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          Assigned
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}