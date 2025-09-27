import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Calendar as CalendarIcon, Clock, Save, X, MapPin, Users, Check, RefreshCw } from 'lucide-react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';
import { supabase, Database } from '../lib/supabase';
import { invalidateEventsCache, invalidateDashboardCache } from '../utils/queryCache';

type TempleEvent = Database['public']['Tables']['temple_events']['Row'];

export default function TempleEvents() {
  const { userProfile } = useClerkAuth();
  const isCommittee = userProfile?.role === 'committee' || userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  const [events, setEvents] = useState<TempleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TempleEvent | null>(null);
  const [formData, setFormData] = useState({
    event_type: 'other' as 'poya_day' | 'ceremony' | 'festival' | 'meeting' | 'other',
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    all_day: false,
    max_participants: '',
    registration_required: false,
    is_recurring: false,
    recurrence_type: 'monthly' as 'monthly' | 'weekly' | 'yearly',
    recurrence_interval: 1,
    recurrence_end_date: '',
    assignment_type: 'all' as 'all' | 'specific' | 'group',
    is_assigned_only: false,
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchEvents();
  }, [userProfile, isCommittee]);

  // Listen for real-time changes to event assignments
  useEffect(() => {
    if (!userProfile?.id) return;

    const channel = supabase
      .channel('event_assignments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_assignments',
          filter: `user_id=eq.${userProfile?.id}`
        },
        (payload) => {
          // Show notification for new assignments
          if (payload.eventType === 'INSERT') {
            setNotification({ 
              type: 'success', 
              message: 'You have been assigned to a new event!' 
            });
            setTimeout(() => setNotification(null), 5000);
          }
          // Refresh events when assignments change
          fetchEvents(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

  const fetchEvents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      let allEvents: TempleEvent[] = [];
      
      if (isCommittee) {
        // Committee members see all events
        const { data, error } = await supabase
          .from('temple_events')
          .select('*')
          .order('start_date', { ascending: true });
        
        if (error) throw error;
        allEvents = data || [];
      } else {
        // Regular users see their created events + assigned events
        const [createdEventsResult, assignedEventsResult] = await Promise.all([
          // Events created by the user
          supabase
            .from('temple_events')
            .select('*')
            .eq('user_id', userProfile?.id)
            .order('start_date', { ascending: true }),
          
          // Events assigned to the user - using a different approach
          supabase
            .from('event_assignments')
            .select('event_id')
            .eq('user_id', userProfile?.id)
        ]);

        if (createdEventsResult.error) throw createdEventsResult.error;
        if (assignedEventsResult.error) throw assignedEventsResult.error;

        // Get assigned event IDs
        const assignedEventIds = assignedEventsResult.data?.map(assignment => assignment.event_id) || [];

        // Fetch the actual assigned events
        let assignedEvents: TempleEvent[] = [];
        if (assignedEventIds.length > 0) {
          const { data: assignedEventsData, error: assignedEventsError } = await supabase
            .from('temple_events')
            .select('*')
            .in('id', assignedEventIds)
            .order('start_date', { ascending: true });
          
          if (assignedEventsError) throw assignedEventsError;
          assignedEvents = assignedEventsData || [];
        }

        // Combine created and assigned events
        const createdEvents = createdEventsResult.data || [];

        // Merge and deduplicate events
        const eventMap = new Map();
        [...createdEvents, ...assignedEvents].forEach(event => {
          if (event && !eventMap.has(event.id)) {
            eventMap.set(event.id, event);
          }
        });
        
        allEvents = Array.from(eventMap.values()).sort((a, b) => 
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
      }
      
      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchEvents(true);
  };

  const createRecurringInstances = async (parentEvent: TempleEvent) => {
    if (!parentEvent.is_recurring || !parentEvent.recurrence_type) return;

    const startDate = new Date(parentEvent.start_date);
    const endDate = parentEvent.recurrence_end_date ? new Date(parentEvent.recurrence_end_date) : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
    const interval = parentEvent.recurrence_interval || 1;
    
    const instances = [];
    let currentDate = new Date(startDate);
    
    // Generate recurring instances
    while (currentDate <= endDate) {
      // Skip the original event date
      if (currentDate.getTime() !== startDate.getTime()) {
        const instanceData = {
          ...parentEvent,
          id: undefined, // Let database generate new ID
          parent_event_id: parentEvent.id,
          start_date: currentDate.toISOString().split('T')[0] + 'T' + startDate.toISOString().split('T')[1],
          end_date: parentEvent.end_date ? 
            new Date(currentDate.getTime() + (new Date(parentEvent.end_date).getTime() - startDate.getTime())).toISOString() : 
            null,
          created_at: undefined,
          updated_at: undefined,
        };
        
        instances.push(instanceData);
      }
      
      // Calculate next occurrence
      if (parentEvent.recurrence_type === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + interval);
      } else if (parentEvent.recurrence_type === 'weekly') {
        currentDate.setDate(currentDate.getDate() + (7 * interval));
      } else if (parentEvent.recurrence_type === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + interval);
      }
    }
    
    // Insert all recurring instances
    if (instances.length > 0) {
      const { error } = await supabase
        .from('temple_events')
        .insert(instances);
      
      if (error) {
        console.error('Error creating recurring instances:', error);
        throw error;
      }
    }
  };

  const handleSaveEvent = async () => {
    if (!formData.title.trim() || !formData.start_date) return;

    try {
      const eventData = {
        event_type: formData.event_type,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        all_day: formData.all_day,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        registration_required: formData.registration_required,
        is_recurring: formData.is_recurring,
        recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
        recurrence_interval: formData.is_recurring ? formData.recurrence_interval : null,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : null,
        assignment_type: formData.assignment_type,
        is_assigned_only: formData.is_assigned_only,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('temple_events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;
      } else {
        const { data: insertedEvent, error } = await supabase
          .from('temple_events')
          .insert({
            ...eventData,
            user_id: userProfile!.id,
          })
          .select()
          .single();

        if (error) throw error;

        // If it's a recurring event, create the recurring instances
        if (formData.is_recurring && insertedEvent) {
          await createRecurringInstances(insertedEvent);
        }
      }

      // Invalidate caches and refresh events
      invalidateEventsCache();
      invalidateDashboardCache();
      await fetchEvents();
      setShowEditor(false);
      setEditingEvent(null);
      setFormData({
        event_type: 'other',
        title: '',
        description: '',
        location: '',
        start_date: '',
        end_date: '',
        all_day: false,
        max_participants: '',
        registration_required: false,
        is_recurring: false,
        recurrence_type: 'monthly',
        recurrence_interval: 1,
        recurrence_end_date: '',
        assignment_type: 'all',
        is_assigned_only: false,
      });
      setNotification({ 
        type: 'success', 
        message: editingEvent ? 'Event updated successfully!' : 'Event created successfully!' 
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error saving event:', error);
      setNotification({ 
        type: 'error', 
        message: 'Error saving event. Please try again.' 
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleEditEvent = (event: TempleEvent) => {
    setEditingEvent(event);
    setFormData({
      event_type: event.event_type,
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      start_date: new Date(event.start_date).toISOString().slice(0, 16),
      end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
      all_day: event.all_day,
      max_participants: event.max_participants ? event.max_participants.toString() : '',
      registration_required: event.registration_required,
      is_recurring: event.is_recurring || false,
      recurrence_type: event.recurrence_type || 'monthly',
      recurrence_interval: event.recurrence_interval || 1,
      recurrence_end_date: event.recurrence_end_date ? new Date(event.recurrence_end_date).toISOString().slice(0, 10) : '',
      assignment_type: event.assignment_type || 'all',
      is_assigned_only: event.is_assigned_only || false,
    });
    setShowEditor(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('temple_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      
      // Invalidate caches and refresh events
      invalidateEventsCache();
      invalidateDashboardCache();
      await fetchEvents();
      setNotification({ 
        type: 'success', 
        message: 'Event deleted successfully!' 
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error deleting event:', error);
      setNotification({ 
        type: 'error', 
        message: 'Error deleting event. Please try again.' 
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingEvent(null);
    setFormData({
      event_type: 'other',
      title: '',
      description: '',
      location: '',
      start_date: '',
      end_date: '',
      all_day: false,
      max_participants: '',
      registration_required: false,
      is_recurring: false,
      recurrence_type: 'monthly',
      recurrence_interval: 1,
      recurrence_end_date: '',
      assignment_type: 'all',
      is_assigned_only: false,
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'poya_day': return 'bg-yellow-100 text-yellow-800';
      case 'ceremony': return 'bg-purple-100 text-purple-800';
      case 'festival': return 'bg-red-100 text-red-800';
      case 'meeting': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEventDate = (startDate: string, endDate: string | null, allDay: boolean) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (allDay) {
      return `All day - ${start.toLocaleDateString()} (${timezone})`;
    }

    if (end && end.toDateString() !== start.toDateString()) {
      return `${start.toLocaleString()} - ${end.toLocaleString()} (${timezone})`;
    } else if (end) {
      return `${start.toLocaleDateString()} ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()} (${timezone})`;
    } else {
      return `${start.toLocaleString()} (${timezone})`;
    }
  };

  const getCurrentTime = () => {
    return new Date();
  };

  const isEventUpcoming = (event: TempleEvent) => {
    const now = getCurrentTime();
    const eventEndTime = event.end_date ? new Date(event.end_date) : new Date(event.start_date);
    return eventEndTime > now;
  };

  const isEventPast = (event: TempleEvent) => {
    return !isEventUpcoming(event);
  };

  const filterEventsByTab = (events: TempleEvent[]) => {
    if (activeTab === 'upcoming') {
      return events.filter(isEventUpcoming);
    } else {
      return events.filter(isEventPast);
    }
  };

  const groupEventsByDate = (events: TempleEvent[]) => {
    const groups: { [key: string]: TempleEvent[] } = {};
    
    events.forEach(event => {
      const eventDate = new Date(event.start_date);
      const dateKey = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    
    // Sort events within each date group by start time
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey].sort((a, b) => {
        if (activeTab === 'upcoming') {
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        } else {
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        }
      });
    });

    // Sort date groups chronologically
    const sortedGroups: { [key: string]: TempleEvent[] } = {};
    const sortedDates = Object.keys(groups).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      if (activeTab === 'upcoming') {
        return dateA.getTime() - dateB.getTime();
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });

    sortedDates.forEach(date => {
      sortedGroups[date] = groups[date];
    });

    return sortedGroups;
  };

  if (userProfile?.status !== 'approved') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            You need to be approved to access temple events.
          </p>
        </div>
      </div>
    );
  }

  const filteredEvents = filterEventsByTab(events);
  const eventGroups = groupEventsByDate(filteredEvents);

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl max-w-sm transform transition-all duration-300 ease-in-out ${
          notification.type === 'success' 
            ? 'bg-green-50 border-l-4 border-green-400 text-green-800' 
            : 'bg-red-50 border-l-4 border-red-400 text-red-800'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <Check className="w-6 h-6 text-green-400" />
              ) : (
                <X className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">
                {notification.type === 'success' ? 'Success!' : 'Error!'}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {notification.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setNotification(null)}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isCommittee ? 'All Temple Events' : 'Temple Events'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isCommittee ? 'Manage all temple events and ceremonies' : 'View temple events, ceremonies, and special occasions'}
          </p>
          <div className="text-sm text-gray-500 mt-1">
            <Clock className="w-4 h-4 inline mr-1" />
            Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </div>
          {!isCommittee && events.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-3 text-sm">
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-center sm:text-left">
                {events.filter(e => e.user_id === userProfile?.id).length} Created by You
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-center sm:text-left">
                {events.filter(e => e.user_id !== userProfile?.id).length} Assigned to You
              </span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors w-full sm:w-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          
          {isCommittee && (
            <button
              onClick={() => setShowEditor(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              <span>New Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Event Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4" />
                <span>Upcoming Events</span>
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                  {events.filter(isEventUpcoming).length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'past'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Past Events</span>
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                  {events.filter(isEventPast).length}
                </span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {showEditor && (
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={handleSaveEvent}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  id="event_type"
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="other">Other</option>
                  <option value="poya_day">Poya Day</option>
                  <option value="ceremony">Ceremony</option>
                  <option value="festival">Festival</option>
                  <option value="meeting">Committee Meeting</option>
                </select>
              </div>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter event location..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Participants (Optional)
                </label>
                <input
                  type="number"
                  id="max_participants"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  placeholder="Enter maximum participants..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="all_day"
                    checked={formData.all_day}
                    onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="all_day" className="ml-2 text-sm text-gray-700">
                    All day event
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="registration_required"
                    checked={formData.registration_required}
                    onChange={(e) => setFormData({ ...formData, registration_required: e.target.checked })}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="registration_required" className="ml-2 text-sm text-gray-700">
                    Registration required
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="is_recurring" className="ml-2 text-sm text-gray-700">
                    Recurring event
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_assigned_only"
                    checked={formData.is_assigned_only}
                    onChange={(e) => setFormData({ ...formData, is_assigned_only: e.target.checked })}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="is_assigned_only" className="ml-2 text-sm text-gray-700">
                    Assign to specific users/groups only
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Recurring Event Settings */}
          {formData.is_recurring && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium text-blue-900 mb-4">Recurring Event Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="recurrence_type" className="block text-sm font-medium text-gray-700 mb-2">
                    Recurrence Type
                  </label>
                  <select
                    id="recurrence_type"
                    value={formData.recurrence_type}
                    onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="recurrence_interval" className="block text-sm font-medium text-gray-700 mb-2">
                    Every (Number)
                  </label>
                  <input
                    type="number"
                    id="recurrence_interval"
                    min="1"
                    max="12"
                    value={formData.recurrence_interval}
                    onChange={(e) => setFormData({ ...formData, recurrence_interval: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="recurrence_end_date" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="recurrence_end_date"
                    value={formData.recurrence_end_date}
                    onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                This will create recurring instances of this event. For example: "Every 1 month" will create the same event every month.
              </p>
            </div>
          )}

          {/* Assignment Settings */}
          {formData.is_assigned_only && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="text-lg font-medium text-purple-900 mb-4">Assignment Settings</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="assignment_type" className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Type
                  </label>
                  <select
                    id="assignment_type"
                    value={formData.assignment_type}
                    onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">All Users</option>
                    <option value="specific">Specific Users</option>
                    <option value="group">User Groups</option>
                  </select>
                </div>
                <p className="text-sm text-purple-700">
                  {formData.assignment_type === 'all' && 'This event will be visible to all users.'}
                  {formData.assignment_type === 'specific' && 'You can assign this event to specific users after creating it.'}
                  {formData.assignment_type === 'group' && 'You can assign this event to user groups after creating it.'}
                </p>
              </div>
            </div>
          )}
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
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          {activeTab === 'upcoming' ? (
            <>
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
              <p className="text-gray-600">
                {isCommittee ? 'Create your first temple event to get started.' : 'No upcoming temple events are currently scheduled.'}
              </p>
            </>
          ) : (
            <>
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No past events</h3>
              <p className="text-gray-600">
                No past temple events found. Past events will appear here once they have ended.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(eventGroups).map(([date, dayEvents]) => (
            <div key={date} className="bg-white rounded-lg shadow-sm border">
              <div className="bg-orange-50 px-6 py-3 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {date}
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                {dayEvents.map((event) => (
                  <div key={event.id} className="flex flex-col lg:flex-row lg:items-start lg:justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors space-y-4 lg:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                        <h4 className="text-lg font-medium text-gray-900 truncate">{event.title}</h4>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getEventTypeColor(event.event_type)}`}>
                            {event.event_type.replace('_', ' ')}
                          </span>
                          {event.user_id === userProfile?.id ? (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              Created by You
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              Assigned to You
                            </span>
                          )}
                          {event.all_day && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              All Day
                            </span>
                          )}
                          {event.registration_required && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Registration Required
                            </span>
                          )}
                          {event.is_recurring && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Recurring
                            </span>
                          )}
                          {event.parent_event_id && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                              Recurring Instance
                            </span>
                          )}
                          {event.is_assigned_only && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              Assigned Only
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {event.description && (
                        <p className="text-gray-600 mb-2">{event.description}</p>
                      )}
                      
                      <div className="flex flex-col space-y-2 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{formatEventDate(event.start_date, event.end_date, event.all_day)}</span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-start space-x-1">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        
                        {event.max_participants && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span>Max {event.max_participants} participants</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center lg:justify-end space-x-2">
                      {(isCommittee || event.user_id === userProfile?.id) && (
                        <>
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
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