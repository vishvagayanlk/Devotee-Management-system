import { useState, useEffect } from 'react';
import { Check, X, Trash2, Search, Filter, Edit3, Save, Activity, Heart, MapPin, Phone, CreditCard, Settings, Calendar, UserCheck, Building2, QrCode, Scan, Users } from 'lucide-react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';
import { supabase, Database } from '../lib/supabase';
import QRCodeGenerator from './QRCodeGenerator';
import QRCodeScanner from './QRCodeScanner';

type DevoteeProfile = Database['public']['Tables']['user_profiles']['Row'];
type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
type Group = Database['public']['Tables']['groups']['Row'];
type TempleEvent = Database['public']['Tables']['temple_events']['Row'];

export default function DevoteeManagement() {
  const { userProfile } = useClerkAuth();
  const isCommittee = userProfile?.role === 'committee' || userProfile?.role === 'admin';
  
  const [devotees, setDevotees] = useState<DevoteeProfile[]>([]);
  const [filteredDevotees, setFilteredDevotees] = useState<DevoteeProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'devotee' | 'committee' | 'admin' | 'super_admin'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'status' | 'group'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingDevotee, setEditingDevotee] = useState<DevoteeProfile | null>(null);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [showEventAssignment, setShowEventAssignment] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });
  const [events, setEvents] = useState<TempleEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TempleEvent | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'other' as 'poya_day' | 'ceremony' | 'festival' | 'meeting' | 'other',
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
  
  // QR Code states
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedDevoteeForQR, setSelectedDevoteeForQR] = useState<DevoteeProfile | null>(null);
  const [showQuickGroupAssign, setShowQuickGroupAssign] = useState(false);
  const [selectedDevoteeForGroup, setSelectedDevoteeForGroup] = useState<DevoteeProfile | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showQuickEventAssignment, setShowQuickEventAssignment] = useState(false);
  const [selectedUserForEvent, setSelectedUserForEvent] = useState<DevoteeProfile | null>(null);
  const [assignedUsers, setAssignedUsers] = useState<Set<string>>(new Set());
  const [userAssignedEvents, setUserAssignedEvents] = useState<Map<string, Set<string>>>(new Map());
  const [editForm, setEditForm] = useState({
    full_name: '',
    nic_number: '',
    address: '',
    phone: '',
    email: '',
    date_of_birth: '',
    occupation: '',
    emergency_contact: '',
    temple_join_date: '',
    bio: '',
    role: 'devotee' as 'devotee' | 'committee' | 'admin' | 'super_admin',
    status: 'pending' as 'pending' | 'approved' | 'rejected',
    group_id: '',
  });
  const [showActivity, setShowActivity] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [deletingDevotee, setDeletingDevotee] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isCommittee) {
      fetchDevotees();
      fetchGroups();
      fetchEvents();
    }
  }, [isCommittee]);

  // Filter and sort devotees whenever filters change
  useEffect(() => {
    let filtered = [...devotees];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(devotee =>
        devotee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        devotee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        devotee.phone?.includes(searchTerm) ||
        devotee.nic_number?.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(devotee => devotee.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(devotee => devotee.role === roleFilter);
    }

    // Group filter
    if (groupFilter !== 'all') {
      filtered = filtered.filter(devotee => devotee.group_id === groupFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.full_name.toLowerCase();
          bValue = b.full_name.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'group':
          const aGroup = groups.find(g => g.id === a.group_id);
          const bGroup = groups.find(g => g.id === b.group_id);
          aValue = aGroup?.name || 'No Group';
          bValue = bGroup?.name || 'No Group';
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDevotees(filtered);
  }, [devotees, searchTerm, statusFilter, roleFilter, groupFilter, sortBy, sortOrder, groups]);

  // Filter users for event assignment search
  const filteredUsersForAssignment = filteredDevotees.filter(devotee =>
    devotee.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    devotee.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    devotee.phone?.includes(userSearchTerm)
  );

  const fetchDevotees = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          groups:group_id (
            id,
            name,
            color
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDevotees(data || []);
    } catch (error) {
      console.error('Error fetching devotees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('temple_events')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };


  const handleStatusUpdate = async (devoteeId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: newStatus })
        .eq('id', devoteeId);

      if (error) throw error;
      await fetchDevotees();
    } catch (error) {
      console.error('Error updating devotee status:', error);
    }
  };

  const handleDeleteDevotee = async (devoteeId: string) => {
    if (!confirm('Are you sure you want to delete this devotee? This action cannot be undone.')) {
      return;
    }

    setDeletingDevotee(devoteeId);
    try {
      console.log('Attempting to delete devotee:', devoteeId);
      
      // First, try to delete related records
      const { error: recordsError } = await supabase
        .from('devotee_records')
        .delete()
        .eq('user_id', devoteeId);
      
      if (recordsError) {
        console.warn('Error deleting devotee records:', recordsError);
        // Continue with profile deletion even if records deletion fails
      }

      // Delete activity logs
      const { error: logsError } = await supabase
        .from('activity_logs')
        .delete()
        .eq('user_id', devoteeId);
      
      if (logsError) {
        console.warn('Error deleting activity logs:', logsError);
        // Continue with profile deletion even if logs deletion fails
      }

      // Delete event assignments
      const { error: assignmentsError } = await supabase
        .from('event_assignments')
        .delete()
        .eq('user_id', devoteeId);
      
      if (assignmentsError) {
        console.warn('Error deleting event assignments:', assignmentsError);
        // Continue with profile deletion even if assignments deletion fails
      }

      // Finally, delete the user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', devoteeId);
      
      if (profileError) {
        console.error('Error deleting user profile:', profileError);
        throw new Error(`Failed to delete user profile: ${profileError.message}`);
      }
      
      console.log('Devotee deleted successfully');
      await fetchDevotees();
      setNotification({ type: 'success', message: 'Devotee deleted successfully!' });
      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error deleting devotee:', error);
      setNotification({ type: 'error', message: `Error deleting devotee: ${error instanceof Error ? error.message : 'Unknown error'}` });
      // Auto-hide notification after 5 seconds for errors
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setDeletingDevotee(null);
    }
  };

  const handleEditDevotee = (devotee: DevoteeProfile) => {
    setEditingDevotee(devotee);
    setEditForm({
      full_name: devotee.full_name,
      nic_number: devotee.nic_number || '',
      address: devotee.address || '',
      phone: devotee.phone || '',
      email: devotee.email || '',
      date_of_birth: devotee.date_of_birth || '',
      occupation: devotee.occupation || '',
      emergency_contact: devotee.emergency_contact || '',
      temple_join_date: devotee.temple_join_date || '',
      bio: devotee.bio || '',
      role: devotee.role,
      status: devotee.status,
      group_id: devotee.group_id || '',
    });
  };

  const handleSaveDevotee = async () => {
    if (!editingDevotee) return;

    // Validate required fields
    if (!editForm.full_name?.trim()) {
      alert('Full name is required');
      return;
    }

    // Sanitize inputs
    const sanitizedData = {
      full_name: editForm.full_name.trim(),
      nic_number: editForm.nic_number?.trim().toUpperCase() || null,
      address: editForm.address?.trim() || null,
      phone: editForm.phone?.trim() || null,
      email: editForm.email?.trim().toLowerCase() || null,
      date_of_birth: editForm.date_of_birth || null,
      occupation: editForm.occupation?.trim() || null,
      emergency_contact: editForm.emergency_contact?.trim() || null,
      temple_join_date: editForm.temple_join_date || null,
      bio: editForm.bio?.trim() || null,
      role: editForm.role,
      status: editForm.status,
      group_id: editForm.group_id || null,
    };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(sanitizedData)
        .eq('id', editingDevotee.id);

      if (error) throw error;
      
      await fetchDevotees();
      setEditingDevotee(null);
    } catch (error) {
      console.error('Error updating devotee:', error);
      alert('Error updating devotee. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingDevotee(null);
    setEditForm({
      full_name: '',
      nic_number: '',
      address: '',
      phone: '',
      email: '',
      date_of_birth: '',
      occupation: '',
      emergency_contact: '',
      temple_join_date: '',
      bio: '',
      role: 'devotee',
      status: 'pending',
      group_id: '',
    });
  };

  // Group management functions
  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      alert('Group name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('groups')
        .insert([groupForm]);

      if (error) throw error;
      await fetchGroups();
      setGroupForm({ name: '', description: '', color: '#3B82F6' });
      setNotification({ type: 'success', message: 'Group created successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error creating group:', error);
      setNotification({ type: 'error', message: 'Error creating group. Please try again.' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || '',
      color: group.color,
    });
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !groupForm.name.trim()) {
      alert('Group name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('groups')
        .update(groupForm)
        .eq('id', editingGroup.id);

      if (error) throw error;
      await fetchGroups();
      setEditingGroup(null);
      setGroupForm({ name: '', description: '', color: '#3B82F6' });
      setNotification({ type: 'success', message: 'Group updated successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error updating group:', error);
      setNotification({ type: 'error', message: 'Error updating group. Please try again.' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This will remove all group assignments.')) return;

    try {
      const { error } = await supabase
        .from('groups')
        .update({ is_active: false })
        .eq('id', groupId);

      if (error) throw error;
      await fetchGroups();
      await fetchDevotees();
      setNotification({ type: 'success', message: 'Group deleted successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error deleting group:', error);
      setNotification({ type: 'error', message: 'Error deleting group. Please try again.' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleCancelGroupEdit = () => {
    setEditingGroup(null);
    setGroupForm({ name: '', description: '', color: '#3B82F6' });
  };

  // Event assignment functions
  const handleAssignEventToUser = async (eventId: string, userId: string) => {
    try {
      // First check if the assignment already exists
      const { data: existingAssignment, error: checkError } = await supabase
        .from('event_assignments')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingAssignment) {
        setNotification({ 
          type: 'error', 
          message: 'This user is already assigned to this event.' 
        });
        setTimeout(() => setNotification(null), 5000);
        return;
      }

      const { error } = await supabase
        .from('event_assignments')
        .insert([{ event_id: eventId, user_id: userId }]);

      if (error) {
        if (error.code === '23505') {
          setNotification({ 
            type: 'error', 
            message: 'This user is already assigned to this event.' 
          });
        } else {
          throw error;
        }
      } else {
        setNotification({ type: 'success', message: 'Event assigned successfully!' });
        setTimeout(() => setNotification(null), 3000);
        // Refresh assigned users list
        if (selectedEvent) {
          fetchAssignedUsers(selectedEvent.id);
        }
        // Also refresh user's assigned events if we have the user info
        const user = filteredUsersForAssignment.find(u => u.id === userId);
        if (user) {
          fetchUserAssignedEvents(userId);
        }
      }
    } catch (error) {
      console.error('Error assigning event:', error);
      setNotification({ type: 'error', message: 'Error assigning event. Please try again.' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleAssignEventToGroup = async (eventId: string, groupId: string) => {
    try {
      const { error } = await supabase
        .from('group_event_assignments')
        .insert([{ event_id: eventId, group_id: groupId }]);

      if (error) throw error;
      setNotification({ type: 'success', message: 'Event assigned to group successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error assigning event to group:', error);
      setNotification({ type: 'error', message: 'Error assigning event to group. Please try again.' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Event creation functions
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

  const handleCreateEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.start_date) {
      setNotification({ type: 'error', message: 'Title and start date are required.' });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    try {
      const eventData = {
        ...eventForm,
        max_participants: eventForm.max_participants ? parseInt(eventForm.max_participants) : null,
        end_date: eventForm.end_date || null,
        recurrence_type: eventForm.is_recurring ? eventForm.recurrence_type : null,
        recurrence_interval: eventForm.is_recurring ? eventForm.recurrence_interval : null,
        recurrence_end_date: eventForm.is_recurring && eventForm.recurrence_end_date ? eventForm.recurrence_end_date : null,
      };

      const { data: insertedEvent, error } = await supabase
        .from('temple_events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;

      // If it's a recurring event, create the recurring instances
      if (eventForm.is_recurring && insertedEvent) {
        await createRecurringInstances(insertedEvent);
      }
      
      await fetchEvents();
      setEventForm({
        title: '',
        description: '',
        event_type: 'other',
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
      setShowCreateEvent(false);
      setNotification({ type: 'success', message: 'Event created successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error creating event:', error);
      setNotification({ type: 'error', message: 'Error creating event. Please try again.' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleCancelCreateEvent = () => {
    setShowCreateEvent(false);
    setEventForm({
      title: '',
      description: '',
      event_type: 'other',
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

  // Quick event assignment functions
  const handleQuickAssignEvent = (devotee: DevoteeProfile) => {
    setSelectedUserForEvent(devotee);
    setShowQuickEventAssignment(true);
    // Fetch assigned events for this user
    fetchUserAssignedEvents(devotee.id);
  };

  const handleQuickEventAssignment = async (eventId: string) => {
    if (!selectedUserForEvent) return;

    try {
      // First check if the assignment already exists
      const { data: existingAssignment, error: checkError } = await supabase
        .from('event_assignments')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', selectedUserForEvent.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingAssignment) {
        setNotification({ 
          type: 'error', 
          message: `${selectedUserForEvent.full_name} is already assigned to this event.` 
        });
        setTimeout(() => setNotification(null), 5000);
        return;
      }

      const { error } = await supabase
        .from('event_assignments')
        .insert([{ event_id: eventId, user_id: selectedUserForEvent.id }]);

      if (error) {
        if (error.code === '23505') {
          setNotification({ 
            type: 'error', 
            message: `${selectedUserForEvent.full_name} is already assigned to this event.` 
          });
        } else {
          throw error;
        }
      } else {
        setNotification({ type: 'success', message: `Event assigned to ${selectedUserForEvent.full_name} successfully!` });
        setTimeout(() => setNotification(null), 3000);
        // Refresh user's assigned events
        fetchUserAssignedEvents(selectedUserForEvent.id);
        setShowQuickEventAssignment(false);
        setSelectedUserForEvent(null);
      }
    } catch (error) {
      console.error('Error assigning event:', error);
      setNotification({ type: 'error', message: 'Error assigning event. Please try again.' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleCancelQuickAssignment = () => {
    setShowQuickEventAssignment(false);
    setSelectedUserForEvent(null);
  };

  // Fetch assigned users for selected event
  const fetchAssignedUsers = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_assignments')
        .select('user_id')
        .eq('event_id', eventId);

      if (error) throw error;
      setAssignedUsers(new Set(data?.map(assignment => assignment.user_id) || []));
    } catch (error) {
      console.error('Error fetching assigned users:', error);
      setAssignedUsers(new Set());
    }
  };

  // Fetch assigned events for a specific user
  const fetchUserAssignedEvents = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_assignments')
        .select('event_id')
        .eq('user_id', userId);

      if (error) throw error;
      const eventIds = new Set(data?.map(assignment => assignment.event_id) || []);
      setUserAssignedEvents(prev => new Map(prev.set(userId, eventIds)));
    } catch (error) {
      console.error('Error fetching user assigned events:', error);
      setUserAssignedEvents(prev => new Map(prev.set(userId, new Set())));
    }
  };


  const fetchDevoteeActivity = async (devoteeId: string) => {
    setLoadingActivity(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', devoteeId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleShowActivity = (devoteeId: string) => {
    if (showActivity === devoteeId) {
      setShowActivity(null);
    } else {
      setShowActivity(devoteeId);
      fetchDevoteeActivity(devoteeId);
    }
  };

  // Auth check is now handled by ProtectedRoute component


  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800';
      case 'committee':
        return 'px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800';
      default:
        return 'px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800';
    }
  };

  // QR Code functions
  const handleGenerateQR = (devotee: DevoteeProfile) => {
    setSelectedDevoteeForQR(devotee);
    setShowQRGenerator(true);
  };

  const handleQRScanResult = (devoteeData: any) => {
    // Find the devotee by ID and scroll to them
    const devotee = devotees.find(d => d.id === devoteeData.id);
    if (devotee) {
      setSearchTerm(devotee.full_name);
      setStatusFilter('all');
      setRoleFilter('all');
      setGroupFilter('all');
      // Scroll to the devotee in the list
      setTimeout(() => {
        const element = document.getElementById(`devotee-${devotee.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-primary', 'ring-opacity-50');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50');
          }, 3000);
        }
      }, 100);
    }
    setShowQRScanner(false);
  };

  const handleQuickGroupAssign = (devotee: DevoteeProfile) => {
    setSelectedDevoteeForGroup(devotee);
    setShowQuickGroupAssign(true);
  };

  const handleAssignToGroup = async (groupId: string) => {
    if (!selectedDevoteeForGroup) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ group_id: groupId || null })
        .eq('id', selectedDevoteeForGroup.id);

      if (error) throw error;
      
      await fetchDevotees();
      setShowQuickGroupAssign(false);
      setSelectedDevoteeForGroup(null);
      setNotification({ type: 'success', message: 'Devotee group assignment updated successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error updating group assignment:', error);
      setNotification({ type: 'error', message: 'Error updating group assignment. Please try again.' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
          <h1 className="text-3xl font-bold text-text">Devotee Management</h1>
          <p className="text-muted mt-2">
            Manage devotee registrations, approvals, and member information
          </p>
        </div>
        
        {/* QR Code Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowQRScanner(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-600 transition-colors"
          >
            <Scan className="w-4 h-4" />
            Scan QR Code
          </button>
        </div>
      </div>

      {editingDevotee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Devotee Profile</h3>
            </div>
            
            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Personal Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIC Number
                    </label>
                    <input
                      type="text"
                      value={editForm.nic_number}
                      onChange={(e) => setEditForm({ ...editForm, nic_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={editForm.date_of_birth}
                      onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={editForm.occupation}
                      onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Temple Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact
                    </label>
                    <input
                      type="tel"
                      value={editForm.emergency_contact}
                      onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temple Join Date
                    </label>
                    <input
                      type="date"
                      value={editForm.temple_join_date}
                      onChange={(e) => setEditForm({ ...editForm, temple_join_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'devotee' | 'committee' | 'admin' | 'super_admin' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="devotee">Devotee</option>
                      <option value="committee">Committee Member</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group
                    </label>
                    <select
                      value={editForm.group_id}
                      onChange={(e) => setEditForm({ ...editForm, group_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">No Group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'pending' | 'approved' | 'rejected' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio/Notes
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDevotee}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Management Modal */}
      {showGroupManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Manage Groups</h3>
                <button
                  onClick={() => setShowGroupManagement(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Create/Edit Group Form */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  {editingGroup ? 'Edit Group' : 'Create New Group'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Name *
                    </label>
            <input
              type="text"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter group name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={groupForm.color}
                        onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={groupForm.color}
                        onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter group description (optional)"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-4">
                  {editingGroup ? (
                    <>
                      <button
                        onClick={handleUpdateGroup}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Update Group
                      </button>
                      <button
                        onClick={handleCancelGroupEdit}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCreateGroup}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Create Group
                    </button>
                  )}
                </div>
              </div>

              {/* Groups List */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Existing Groups</h4>
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <div>
                          <h5 className="font-medium text-gray-900">{group.name}</h5>
                          {group.description && (
                            <p className="text-sm text-gray-600">{group.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {devotees.filter(d => d.group_id === group.id).length} members
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditGroup(group)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Assignment Modal */}
      {showEventAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Assign Events</h3>
                <button
                  onClick={() => setShowEventAssignment(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Events List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">Available Events</h4>
                    <button
                      onClick={() => setShowCreateEvent(true)}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Create Event</span>
                    </button>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedEvent?.id === event.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setSelectedEvent(event);
                          fetchAssignedUsers(event.id);
                        }}
                      >
                        <h5 className="font-medium text-gray-900">{event.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(event.start_date).toLocaleDateString()} - {event.event_type}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assignment Options */}
                <div>
                  {selectedEvent ? (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">
                        Assign "{selectedEvent.title}"
                      </h4>
                      
                      {/* Assign to Individual Users */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium text-gray-700">Assign to Individual Users</h5>
                          <div className="text-xs text-gray-500">
                            {filteredUsersForAssignment.length} users
                          </div>
                        </div>
                        
                        {/* User Search */}
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search users by name, email, or phone..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {filteredUsersForAssignment.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                              {userSearchTerm ? 'No users found matching your search' : 'No users available'}
                            </div>
                          ) : (
                            filteredUsersForAssignment.map((devotee) => {
                              const isAssigned = assignedUsers.has(devotee.id);
                              return (
                                <div
                                  key={devotee.id}
                                  className={`flex items-center justify-between p-2 border rounded hover:bg-gray-50 ${
                                    isAssigned ? 'border-green-200 bg-green-50' : 'border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      isAssigned ? 'bg-green-100' : 'bg-orange-100'
                                    }`}>
                                      <Heart className={`w-4 h-4 ${
                                        isAssigned ? 'text-green-600' : 'text-orange-600'
                                      }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{devotee.full_name}</p>
                                      <p className="text-xs text-gray-500 truncate">{devotee.email}</p>
                                      {isAssigned && (
                                        <span className="text-xs text-green-600 font-medium">Already assigned to this event</span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleAssignEventToUser(selectedEvent.id, devotee.id)}
                                    disabled={isAssigned}
                                    className={`px-3 py-1 text-xs rounded transition-colors ${
                                      isAssigned
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-purple-600 text-white hover:bg-purple-700'
                                    }`}
                                  >
                                    {isAssigned ? 'Assigned' : 'Assign'}
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Assign to Groups */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Assign to Groups</h5>
                        <div className="space-y-2">
                          {groups.map((group) => (
                            <div
                              key={group.id}
                              className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50"
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: group.color }}
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{group.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {devotees.filter(d => d.group_id === group.id).length} members
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAssignEventToGroup(selectedEvent.id, group.id)}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              >
                                Assign to Group
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Select an event to assign it to users or groups</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Create New Event</h3>
                <button
                  onClick={handleCancelCreateEvent}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter event title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type
                    </label>
                    <select
                      value={eventForm.event_type}
                      onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="poya_day">Poya Day</option>
                      <option value="ceremony">Ceremony</option>
                      <option value="festival">Festival</option>
                      <option value="meeting">Meeting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter event description"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter event location"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={eventForm.max_participants}
                      onChange={(e) => setEventForm({ ...eventForm, max_participants: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter max participants"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={eventForm.start_date}
                      onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={eventForm.end_date}
                      onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={eventForm.all_day}
                      onChange={(e) => setEventForm({ ...eventForm, all_day: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">All Day Event</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={eventForm.registration_required}
                      onChange={(e) => setEventForm({ ...eventForm, registration_required: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Registration Required</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={eventForm.is_recurring}
                      onChange={(e) => setEventForm({ ...eventForm, is_recurring: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Recurring Event</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={eventForm.is_assigned_only}
                      onChange={(e) => setEventForm({ ...eventForm, is_assigned_only: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Assign to Groups Only</span>
                  </label>
                </div>

                {/* Recurring Event Settings */}
                {eventForm.is_recurring && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">Recurring Event Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recurrence Type
                        </label>
                        <select
                          value={eventForm.recurrence_type}
                          onChange={(e) => setEventForm({ ...eventForm, recurrence_type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="weekly">Weekly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Every (Number)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={eventForm.recurrence_interval}
                          onChange={(e) => setEventForm({ ...eventForm, recurrence_interval: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={eventForm.recurrence_end_date}
                          onChange={(e) => setEventForm({ ...eventForm, recurrence_end_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      This will create recurring instances of this event. For example: "Every 1 month" will create the same event every month.
                    </p>
                  </div>
                )}

                {/* Assignment Settings */}
                {eventForm.is_assigned_only && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="text-sm font-medium text-purple-900 mb-3">Assignment Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assignment Type
                        </label>
                        <select
                          value={eventForm.assignment_type}
                          onChange={(e) => setEventForm({ ...eventForm, assignment_type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="all">All Users</option>
                          <option value="specific">Specific Users</option>
                          <option value="group">User Groups</option>
                        </select>
                      </div>
                      <p className="text-xs text-purple-700">
                        {eventForm.assignment_type === 'all' && 'This event will be visible to all users.'}
                        {eventForm.assignment_type === 'specific' && 'You can assign this event to specific users after creating it.'}
                        {eventForm.assignment_type === 'group' && 'You can assign this event to user groups after creating it.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCreateEvent}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Event
                </button>
                <button
                  onClick={handleCancelCreateEvent}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Event Assignment Modal */}
      {showQuickEventAssignment && selectedUserForEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Assign Event to {selectedUserForEvent.full_name}
                </h3>
                <button
                  onClick={handleCancelQuickAssignment}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{selectedUserForEvent.full_name}</h4>
                    <p className="text-sm text-gray-600 truncate">{selectedUserForEvent.email}</p>
                    {selectedUserForEvent.group_id && (
                      <span 
                        className="inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: groups.find(g => g.id === selectedUserForEvent.group_id)?.color || '#6B7280' }}
                      >
                        {groups.find(g => g.id === selectedUserForEvent.group_id)?.name || 'Unknown Group'}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Show currently assigned events */}
                {userAssignedEvents.get(selectedUserForEvent.id) && userAssignedEvents.get(selectedUserForEvent.id)!.size > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Currently Assigned Events:</h5>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {events
                        .filter(event => userAssignedEvents.get(selectedUserForEvent.id)?.has(event.id) || false)
                        .map(event => (
                          <div key={event.id} className="flex items-center space-x-2 p-2 bg-green-50 rounded border border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(event.start_date).toLocaleDateString()} - {event.event_type.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Select Event to Assign</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {events.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p>No events available. Create an event first.</p>
                    </div>
                  ) : (
                    events.map((event) => {
                      const isAssigned = selectedUserForEvent && userAssignedEvents.get(selectedUserForEvent.id)?.has(event.id);
                      return (
                        <div
                          key={event.id}
                          className={`p-4 border rounded-lg transition-colors ${
                            isAssigned
                              ? 'border-green-200 bg-green-50 cursor-not-allowed'
                              : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                          }`}
                          onClick={() => !isAssigned && handleQuickEventAssignment(event.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h5 className="font-medium text-gray-900 truncate">{event.title}</h5>
                                {isAssigned && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                    Already Assigned
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>{new Date(event.start_date).toLocaleDateString()}</span>
                                <span className="capitalize">{event.event_type.replace('_', ' ')}</span>
                                {event.location && <span className="truncate">{event.location}</span>}
                              </div>
                            </div>
                            <div className={`ml-3 flex-shrink-0 ${
                              isAssigned ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              {isAssigned ? (
                                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3" />
                                </div>
                              ) : (
                                <Calendar className="w-5 h-5" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        {/* Enhanced Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => setShowGroupManagement(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Manage Groups</span>
              </button>
              <button
                onClick={() => setShowEventAssignment(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Calendar className="w-4 h-4" />
                <span>Assign Events</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, phone, NIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'devotee' | 'committee' | 'admin')}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Roles</option>
                <option value="devotee">Devotees</option>
                <option value="committee">Committee</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            {/* Group Filter */}
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Groups</option>
                <option value="">No Group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'created_at' | 'status' | 'group')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full sm:w-auto"
              >
                <option value="created_at">Date Joined</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="group">Group</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <label className="text-sm font-medium text-gray-700">Order:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full sm:w-auto"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <div className="text-sm text-gray-500 text-center sm:text-left">
              Showing {filteredDevotees.length} of {devotees.length} devotees
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDevotees.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No devotees found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No devotees have registered yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDevotees.map((devotee) => (
              <div
                key={devotee.id}
                id={`devotee-${devotee.id}`}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                      <Heart className="w-6 h-6 text-orange-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col space-y-2">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate text-center sm:text-left">{devotee.full_name}</h3>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <span className={getRoleBadge(devotee.role)}>
                          {devotee.role === 'devotee' ? 'Devotee' : devotee.role === 'committee' ? 'Committee' : devotee.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                        <span className={getStatusBadge(devotee.status)}>
                          {devotee.status.charAt(0).toUpperCase() + devotee.status.slice(1)}
                        </span>
                          {devotee.group_id && (
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: groups.find(g => g.id === devotee.group_id)?.color || '#6B7280' }}
                            >
                              {groups.find(g => g.id === devotee.group_id)?.name || 'Unknown Group'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-1 text-sm text-gray-600 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                          {devotee.nic_number && (
                            <div className="flex items-center space-x-1">
                              <CreditCard className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">NIC: {devotee.nic_number}</span>
                            </div>
                          )}
                          {devotee.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{devotee.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <CreditCard className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate font-mono text-xs">ID: {devotee.id}</span>
                          </div>
                        </div>
                        {devotee.address && (
                          <div className="flex items-start space-x-1">
                            <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span className="truncate max-w-full">{devotee.address}</span>
                          </div>
                        )}
                        <span className="text-xs text-gray-500">Registered: {new Date(devotee.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {devotee.bio && (
                        <p className="mt-2 text-sm text-gray-600 max-w-lg">{devotee.bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-3">
                    {/* Status Action Buttons */}
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {devotee.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(devotee.id, 'approved')}
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex-1 sm:flex-none min-w-0"
                        >
                          <Check className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">Approve</span>
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(devotee.id, 'rejected')}
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex-1 sm:flex-none min-w-0"
                        >
                          <X className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">Reject</span>
                        </button>
                      </>
                    )}

                    {devotee.status === 'approved' && devotee.role !== 'admin' && (
                      <button
                        onClick={() => handleStatusUpdate(devotee.id, 'rejected')}
                        className="flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex-1 sm:flex-none min-w-0"
                      >
                        <X className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Reject</span>
                      </button>
                    )}

                    {devotee.status === 'rejected' && (
                      <button
                        onClick={() => handleStatusUpdate(devotee.id, 'approved')}
                        className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex-1 sm:flex-none min-w-0"
                      >
                        <Check className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Approve</span>
                      </button>
                    )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center space-x-1 flex-wrap gap-1">
                    <button
                      onClick={() => handleEditDevotee(devotee)}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Edit Devotee"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleGenerateQR(devotee)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Generate QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleQuickGroupAssign(devotee)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Assign to Group"
                    >
                      <Users className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleShowActivity(devotee.id)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="View Activity"
                    >
                      <Activity className="w-4 h-4" />
                    </button>

                      <button
                        onClick={() => handleQuickAssignEvent(devotee)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-200"
                        title="Assign Event to this user"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>

                    {devotee.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteDevotee(devotee.id)}
                          disabled={deletingDevotee === devotee.id}
                          className={`p-2 rounded-lg transition-colors ${
                            deletingDevotee === devotee.id
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title="Delete devotee"
                        >
                          {deletingDevotee === devotee.id ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                          ) : (
                        <Trash2 className="w-4 h-4" />
                          )}
                      </button>
                    )}
                    </div>
                  </div>
                </div>
                
                {showActivity === devotee.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                      <Activity className="w-4 h-4" />
                      <span>Recent Activity</span>
                    </h4>
                    
                    {loadingActivity ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : activityLogs.length === 0 ? (
                      <p className="text-sm text-gray-500">No activity recorded</p>
                    ) : (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {activityLogs.map((log) => (
                          <div key={log.id} className="text-xs">
                            <p className="text-gray-700">
                              {log.description || `${log.action} on ${log.table_name}`}
                            </p>
                            <p className="text-gray-500">
                              {new Date(log.created_at).toLocaleString()}
                              {log.admin_id && (
                                <span className="ml-2 text-purple-600">by committee</span>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Generator Modal */}
      {showQRGenerator && selectedDevoteeForQR && (
        <QRCodeGenerator
          devoteeId={selectedDevoteeForQR.id}
          devoteeName={selectedDevoteeForQR.full_name}
          devoteeEmail={selectedDevoteeForQR.email || ''}
          devoteeRole={selectedDevoteeForQR.role}
          onClose={() => {
            setShowQRGenerator(false);
            setSelectedDevoteeForQR(null);
          }}
        />
      )}

      {/* QR Code Scanner Modal */}
      {showQRScanner && (
        <QRCodeScanner
          onScanResult={handleQRScanResult}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Quick Group Assignment Modal */}
      {showQuickGroupAssign && selectedDevoteeForGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">Assign to Group</h3>
              <button
                onClick={() => setShowQuickGroupAssign(false)}
                className="text-muted hover:text-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-muted mb-2">Assigning:</p>
              <div className="flex items-center space-x-3 p-3 bg-surface-secondary rounded-lg">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-text">{selectedDevoteeForGroup.full_name}</p>
                  <p className="text-sm text-muted">{selectedDevoteeForGroup.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleAssignToGroup('')}
                className="w-full flex items-center justify-between p-3 border border-border rounded-lg hover:bg-border-light transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-text">No Group</p>
                    <p className="text-sm text-muted">Remove from current group</p>
                  </div>
                </div>
                {!selectedDevoteeForGroup.group_id && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
              </button>

              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleAssignToGroup(group.id)}
                  className="w-full flex items-center justify-between p-3 border border-border rounded-lg hover:bg-border-light transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: group.color }}
                    >
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-text">{group.name}</p>
                      <p className="text-sm text-muted">{group.description || 'No description'}</p>
                    </div>
                  </div>
                  {selectedDevoteeForGroup.group_id === group.id && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowQuickGroupAssign(false)}
                className="px-4 py-2 text-muted hover:text-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}