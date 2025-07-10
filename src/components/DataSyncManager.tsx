import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/useReduxState';
import { syncExternalData } from '../store/slices/apiSlice';
import { 
  RefreshCw, 
  Database, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  Download, 
  Upload 
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

interface SyncLog {
  id: string;
  api_source: string;
  sync_type: string;
  status: string;
  items_synced: number;
  errors_count: number;
  error_details?: any;
  duration_ms?: number;
  started_at: string;
  completed_at?: string;
}

const DataSyncManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { syncing, lastSyncTime, syncStats } = useAppSelector(state => state.api);
  const { isAdmin } = useAppSelector(state => state.user);
  
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncSchedule, setSyncSchedule] = useState({
    enabled: false,
    interval: 'daily', // 'hourly', 'daily', 'weekly'
    time: '02:00', // For daily/weekly
    day: 'monday', // For weekly
  });
  
  useEffect(() => {
    if (isAdmin) {
      fetchSyncLogs();
    }
  }, [isAdmin]);
  
  const fetchSyncLogs = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_sync_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      
      if (error) {
        throw error;
      }
      
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSync = async () => {
    if (!isAdmin) {
      alert('Only admins can perform data synchronization');
      return;
    }
    
    try {
      await dispatch(syncExternalData()).unwrap();
      fetchSyncLogs();
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  };
  
  const handleScheduleChange = (field: string, value: string) => {
    setSyncSchedule(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const toggleSchedule = () => {
    setSyncSchedule(prev => ({
      ...prev,
      enabled: !prev.enabled,
    }));
    
    // In a real app, this would save the schedule to the database
    // and set up a cron job or similar
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'partial':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'in_progress':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };
  
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Access Required</h3>
          <p className="text-gray-600">
            You need administrator privileges to access the data synchronization manager.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Data Synchronization</h2>
              <p className="text-indigo-100 text-sm">Manage data imports from external sources</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-xs text-indigo-100">
              {lastSyncTime ? `Last sync: ${format(new Date(lastSyncTime), 'MMM d, yyyy HH:mm')}` : 'Never synced'}
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Sync Stats */}
        {lastSyncTime && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Sync Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-emerald-700">{syncStats.golfCourses}</div>
                <div className="text-sm text-emerald-600">Golf Courses</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{syncStats.hotels}</div>
                <div className="text-sm text-blue-600">Hotels</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-amber-700">{syncStats.restaurants}</div>
                <div className="text-sm text-amber-600">Restaurants</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">{syncStats.experiences}</div>
                <div className="text-sm text-purple-600">Experiences</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{syncStats.errors}</div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Sync Schedule */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Schedule</h3>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={syncSchedule.enabled}
                    onChange={toggleSchedule}
                    className="sr-only peer"
                    id="schedule-toggle"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </div>
                <label htmlFor="schedule-toggle" className="text-sm font-medium text-gray-900">
                  {syncSchedule.enabled ? 'Automatic sync enabled' : 'Automatic sync disabled'}
                </label>
              </div>
              
              <div className="text-sm text-gray-500">
                Next sync: {syncSchedule.enabled ? 'Tomorrow at 02:00 AM' : 'Not scheduled'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select
                  value={syncSchedule.interval}
                  onChange={(e) => handleScheduleChange('interval', e.target.value)}
                  disabled={!syncSchedule.enabled}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              
              {syncSchedule.interval !== 'hourly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={syncSchedule.time}
                    onChange={(e) => handleScheduleChange('time', e.target.value)}
                    disabled={!syncSchedule.enabled}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              )}
              
              {syncSchedule.interval === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
                  <select
                    value={syncSchedule.day}
                    onChange={(e) => handleScheduleChange('day', e.target.value)}
                    disabled={!syncSchedule.enabled}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
              )}
            </div>
            
            {syncSchedule.enabled && (
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  Data will be automatically synchronized {syncSchedule.interval === 'hourly' ? 'every hour' : 
                  syncSchedule.interval === 'daily' ? `daily at ${syncSchedule.time}` : 
                  `every ${syncSchedule.day} at ${syncSchedule.time}`}.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Sync History */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync History</h3>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Errors</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-5 w-5 text-blue-600 animate-spin mr-2" />
                          <span className="text-gray-600">Loading sync history...</span>
                        </div>
                      </td>
                    </tr>
                  ) : syncLogs.length > 0 ? (
                    syncLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.api_source}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.sync_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(log.status)}
                            <span className={`text-sm ${
                              log.status === 'success' ? 'text-green-600' :
                              log.status === 'failed' ? 'text-red-600' :
                              log.status === 'partial' ? 'text-amber-600' :
                              'text-blue-600'
                            }`}>
                              {log.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.items_synced}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.errors_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(log.started_at), 'MMM d, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.duration_ms ? `${Math.round(log.duration_ms / 1000)}s` : 'In progress'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                // View details
                                console.log('View sync log details:', log);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Details
                            </button>
                            {log.errors_count > 0 && (
                              <button
                                onClick={() => {
                                  // View errors
                                  console.log('View sync errors:', log.error_details);
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                Errors
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        No sync history found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Data Import/Export */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Import/Export</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-start space-x-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Upload className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Import Data</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Import data from CSV or JSON files
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Type
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="golf_courses">Golf Courses</option>
                    <option value="hotels">Hotels</option>
                    <option value="restaurants">Restaurants</option>
                    <option value="experiences">Experiences</option>
                    <option value="packages">Packages</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Format
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="fileFormat"
                        value="csv"
                        className="text-blue-600 focus:ring-blue-500"
                        defaultChecked
                      />
                      <span className="ml-2 text-sm text-gray-700">CSV</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="fileFormat"
                        value="json"
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">JSON</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">CSV or JSON (max. 10MB)</p>
                      </div>
                      <input type="file" className="hidden" />
                    </label>
                  </div>
                </div>
                
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Import Data
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-start space-x-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Download className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Export Data</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Export data to CSV or JSON files
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Type
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="golf_courses">Golf Courses</option>
                    <option value="hotels">Hotels</option>
                    <option value="restaurants">Restaurants</option>
                    <option value="experiences">Experiences</option>
                    <option value="packages">Packages</option>
                    <option value="bookings">Bookings</option>
                    <option value="users">Users</option>
                    <option value="all">All Data</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Format
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="exportFormat"
                        value="csv"
                        className="text-green-600 focus:ring-green-500"
                        defaultChecked
                      />
                      <span className="ml-2 text-sm text-gray-700">CSV</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="exportFormat"
                        value="json"
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">JSON</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                        defaultChecked
                      />
                      <span className="ml-2 text-sm text-gray-700">Include metadata</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                        defaultChecked
                      />
                      <span className="ml-2 text-sm text-gray-700">Include timestamps</span>
                    </label>
                  </div>
                </div>
                
                <button
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSyncManager;