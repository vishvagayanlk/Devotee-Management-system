import { supabase } from './supabase';
import type { Database } from './supabase';

type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert'];

export interface ActivityLogData {
  userId: string;
  adminId?: string | null;
  action: string;
  tableName: string;
  recordId: string;
  oldValues?: any;
  newValues?: any;
  description?: string;
}

/**
 * Log an activity to the activity_logs table
 */
export async function logActivity(data: ActivityLogData): Promise<boolean> {
  try {
    const logData: ActivityLogInsert = {
      user_id: data.userId,
      admin_id: data.adminId || null,
      action: data.action,
      table_name: data.tableName,
      record_id: data.recordId,
      old_values: data.oldValues || null,
      new_values: data.newValues || null,
      description: data.description || undefined,
    };

    const { error } = await supabase
      .from('activity_logs')
      .insert(logData);

    if (error) {
      console.error('Error logging activity:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in logActivity:', error);
    return false;
  }
}

/**
 * Log a profile update activity
 */
export async function logProfileUpdate(
  userId: string,
  adminId: string | null,
  oldValues: any,
  newValues: any,
  description?: string
): Promise<boolean> {
  return logActivity({
    userId,
    adminId,
    action: 'update',
    tableName: 'user_profiles',
    recordId: userId,
    oldValues,
    newValues,
    description: description || 'Profile updated',
  });
}

/**
 * Log a profile creation activity
 */
export async function logProfileCreation(
  userId: string,
  adminId: string | null,
  newValues: any,
  description?: string
): Promise<boolean> {
  return logActivity({
    userId,
    adminId,
    action: 'create',
    tableName: 'user_profiles',
    recordId: userId,
    newValues,
    description: description || 'Profile created',
  });
}

/**
 * Log a profile deletion activity
 */
export async function logProfileDeletion(
  userId: string,
  adminId: string | null,
  oldValues: any,
  description?: string
): Promise<boolean> {
  return logActivity({
    userId,
    adminId,
    action: 'delete',
    tableName: 'user_profiles',
    recordId: userId,
    oldValues,
    description: description || 'Profile deleted',
  });
}

/**
 * Log an event assignment activity
 */
export async function logEventAssignment(
  userId: string,
  adminId: string | null,
  eventId: string,
  action: 'assign' | 'unassign',
  description?: string
): Promise<boolean> {
  return logActivity({
    userId,
    adminId,
    action,
    tableName: 'event_assignments',
    recordId: eventId,
    description: description || `Event ${action}ed`,
  });
}

/**
 * Log a group assignment activity
 */
export async function logGroupAssignment(
  userId: string,
  adminId: string | null,
  groupId: string,
  action: 'assign' | 'unassign',
  description?: string
): Promise<boolean> {
  return logActivity({
    userId,
    adminId,
    action,
    tableName: 'groups',
    recordId: groupId,
    description: description || `Group ${action}ed`,
  });
}

/**
 * Get activity logs for a user
 */
export async function getUserActivityLogs(
  userId: string,
  limit: number = 20
): Promise<ActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserActivityLogs:', error);
    return [];
  }
}

/**
 * Get all activity logs (admin only)
 */
export async function getAllActivityLogs(
  limit: number = 50,
  offset: number = 0
): Promise<ActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching all activity logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllActivityLogs:', error);
    return [];
  }
}

/**
 * Format activity log for display
 */
export function formatActivityLog(log: ActivityLog): string {
  const timestamp = new Date(log.created_at).toLocaleString();
  const adminNote = log.admin_id ? ' (by admin)' : '';
  
  if (log.description) {
    return `${log.description} - ${timestamp}${adminNote}`;
  }
  
  return `${log.action} on ${log.table_name} - ${timestamp}${adminNote}`;
}
