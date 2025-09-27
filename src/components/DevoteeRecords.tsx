import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Search, Save, X, BookOpen, Heart, DollarSign, Users } from 'lucide-react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';
import { supabase, Database } from '../lib/supabase';

type DevoteeRecord = Database['public']['Tables']['devotee_records']['Row'];

export default function DevoteeRecords() {
  const { userProfile, isProfileComplete } = useClerkAuth();
  const isCommittee = userProfile?.role === 'committee' || userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  const [records, setRecords] = useState<DevoteeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'prayer' | 'donation' | 'service' | 'note'>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DevoteeRecord | null>(null);
  const [formData, setFormData] = useState({
    record_type: 'note' as 'prayer' | 'donation' | 'service' | 'note',
    title: '',
    content: '',
    amount: '',
    date_recorded: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchRecords();
  }, [userProfile, isCommittee]);

  const fetchRecords = async () => {
    try {
      let query = supabase.from('devotee_records').select('*');
      
      if (!isCommittee) {
        query = query.eq('user_id', userProfile?.id);
      }
      
      const { data, error } = await query.order('date_recorded', { ascending: false });
      
      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!formData.title.trim()) return;

    try {
      const recordData = {
        record_type: formData.record_type,
        title: formData.title,
        content: formData.content,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        date_recorded: formData.date_recorded,
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('devotee_records')
          .update(recordData)
          .eq('id', editingRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('devotee_records')
          .insert({
            ...recordData,
            user_id: userProfile!.id,
          });

        if (error) throw error;
      }

      await fetchRecords();
      setShowEditor(false);
      setEditingRecord(null);
      setFormData({
        record_type: 'note',
        title: '',
        content: '',
        amount: '',
        date_recorded: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error saving record:', error);
    }
  };

  const handleEditRecord = (record: DevoteeRecord) => {
    setEditingRecord(record);
    setFormData({
      record_type: record.record_type,
      title: record.title,
      content: record.content,
      amount: record.amount ? record.amount.toString() : '',
      date_recorded: new Date(record.date_recorded).toISOString().split('T')[0],
    });
    setShowEditor(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const { error } = await supabase
        .from('devotee_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
      await fetchRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingRecord(null);
    setFormData({
      record_type: 'note',
      title: '',
      content: '',
      amount: '',
      date_recorded: new Date().toISOString().split('T')[0],
    });
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'prayer': return Heart;
      case 'donation': return DollarSign;
      case 'service': return Users;
      default: return BookOpen;
    }
  };

  const getRecordColor = (type: string) => {
    switch (type) {
      case 'prayer': return 'bg-red-100 text-red-700';
      case 'donation': return 'bg-green-100 text-green-700';
      case 'service': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || record.record_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (userProfile?.status !== 'approved') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            You need to be approved to access devotee records.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isCommittee ? 'All Devotee Records' : 'My Temple Records'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            {isCommittee ? 'Manage all devotee records and activities' : 'Track your prayers, donations, and temple activities'}
          </p>
        </div>
        
        {(!isCommittee || (isCommittee && userProfile?.id)) && (
          <button
            onClick={() => setShowEditor(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>New Record</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="prayer">Prayers</option>
          <option value="donation">Donations</option>
          <option value="service">Service</option>
          <option value="note">Notes</option>
        </select>
      </div>

      {showEditor && (
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {editingRecord ? 'Edit Record' : 'Create New Record'}
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={handleSaveRecord}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="record_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Record Type
                </label>
                <select
                  id="record_type"
                  value={formData.record_type}
                  onChange={(e) => setFormData({ ...formData, record_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="note">Note</option>
                  <option value="prayer">Prayer</option>
                  <option value="donation">Donation</option>
                  <option value="service">Service</option>
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
                  placeholder="Enter record title..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="date_recorded" className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  id="date_recorded"
                  value={formData.date_recorded}
                  onChange={(e) => setFormData({ ...formData, date_recorded: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {formData.record_type === 'donation' && (
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (LKR)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter donation amount..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="content"
                rows={8}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter record description..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
          <p className="text-gray-600">
            {searchTerm || typeFilter !== 'all' ? 'Try adjusting your search or filter criteria.' : 'Create your first temple record to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const Icon = getRecordIcon(record.record_type);
            return (
              <div key={record.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getRecordColor(record.record_type)}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{record.title}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRecordColor(record.record_type)}`}>
                            {record.record_type}
                          </span>
                          {record.amount && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              LKR {record.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 mb-4 whitespace-pre-wrap break-words">{record.content}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Recorded on {new Date(record.date_recorded).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center lg:justify-end space-x-2">
                      {(!isCommittee || record.user_id === userProfile?.id) && (
                        <>
                          <button
                            onClick={() => handleEditRecord(record)}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit Record"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}