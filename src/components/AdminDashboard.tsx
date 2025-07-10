import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../hooks/useReduxState';
import { 
  Database, 
  Trophy, 
  Building, 
  Utensils, 
  Compass, 
  Package, 
  Calendar, 
  Users, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  Star,
  DollarSign,
  MapPin,
  Phone,
  Globe,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import DataSyncManager from './DataSyncManager';
import ApiHealthMonitor from './ApiHealthMonitor';

interface TableData {
  id: string;
  name: string;
  [key: string]: any;
}

const AdminDashboard: React.FC = () => {
  const { isAdmin } = useAppSelector(state => state.user);
  const [activeTab, setActiveTab] = useState('golf_courses');
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<TableData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Record<string, any>>({});

  // Define table configurations
  const tableConfigs = {
    golf_courses: {
      title: 'Golf Courses',
      icon: Trophy,
      color: 'emerald',
      columns: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'rating', label: 'Rating', type: 'number' },
        { key: 'difficulty', label: 'Difficulty', type: 'text' },
        { key: 'price', label: 'Price', type: 'currency' },
        { key: 'holes', label: 'Holes', type: 'number' },
        { key: 'api_source', label: 'Source', type: 'text' }
      ],
      defaultItem: {
        name: '',
        description: '',
        image: 'https://images.pexels.com/photos/1325735/pexels-photo-1325735.jpeg',
        rating: 4.0,
        difficulty: 'Resort',
        holes: 18,
        yardage: 6500,
        par: 72,
        price: 100,
        amenities: ['Pro Shop', 'Driving Range', 'Putting Green'],
        address: '',
        phone: '',
        website: '',
        available_times: ['7:00 AM', '8:00 AM', '9:00 AM'],
        api_source: 'internal'
      }
    },
    hotels: {
      title: 'Hotels',
      icon: Building,
      color: 'blue',
      columns: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'rating', label: 'Rating', type: 'number' },
        { key: 'price_per_night', label: 'Price/Night', type: 'currency' },
        { key: 'available_rooms', label: 'Available', type: 'number' },
        { key: 'api_source', label: 'Source', type: 'text' }
      ],
      defaultItem: {
        name: '',
        description: '',
        image: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
        rating: 4.0,
        price_per_night: 150,
        amenities: ['Free WiFi', 'Pool', 'Fitness Center'],
        address: '',
        phone: '',
        website: '',
        available_rooms: 10,
        api_source: 'internal'
      }
    },
    restaurants: {
      title: 'Restaurants',
      icon: Utensils,
      color: 'amber',
      columns: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'rating', label: 'Rating', type: 'number' },
        { key: 'cuisine_type', label: 'Cuisine', type: 'text' },
        { key: 'price_range', label: 'Price', type: 'text' },
        { key: 'api_source', label: 'Source', type: 'text' }
      ],
      defaultItem: {
        name: '',
        description: '',
        image: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
        rating: 4.0,
        cuisine_type: 'American',
        price_range: '$$',
        amenities: ['Outdoor Seating', 'Full Bar', 'Reservations'],
        address: '',
        phone: '',
        website: '',
        hours: '11:00 AM - 10:00 PM',
        api_source: 'internal'
      }
    },
    experiences: {
      title: 'Experiences',
      icon: Compass,
      color: 'purple',
      columns: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'rating', label: 'Rating', type: 'number' },
        { key: 'category', label: 'Category', type: 'text' },
        { key: 'price', label: 'Price', type: 'currency' },
        { key: 'duration', label: 'Duration', type: 'text' },
        { key: 'api_source', label: 'Source', type: 'text' }
      ],
      defaultItem: {
        name: '',
        description: '',
        image: 'https://images.pexels.com/photos/1386604/pexels-photo-1386604.jpeg',
        rating: 4.0,
        category: 'Attraction',
        duration: '2 hours',
        price: 50,
        amenities: ['Family Friendly', 'Guided Tour'],
        address: '',
        phone: '',
        website: '',
        available_times: ['10:00 AM', '1:00 PM', '4:00 PM'],
        api_source: 'internal'
      }
    },
    packages: {
      title: 'Packages',
      icon: Package,
      color: 'indigo',
      columns: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'rating', label: 'Rating', type: 'number' },
        { key: 'duration', label: 'Duration', type: 'text' },
        { key: 'price', label: 'Price', type: 'currency' },
        { key: 'api_source', label: 'Source', type: 'text' }
      ],
      defaultItem: {
        name: '',
        description: '',
        image: 'https://images.pexels.com/photos/1325735/pexels-photo-1325735.jpeg',
        rating: 4.0,
        duration: '3 days / 2 nights',
        price: 899,
        includes: ['2 Rounds of Golf', 'Hotel Stay', 'Dining'],
        golf_courses: [],
        hotels: [],
        restaurants: [],
        experiences: [],
        api_source: 'internal'
      }
    },
    bookings: {
      title: 'Bookings',
      icon: Calendar,
      color: 'green',
      columns: [
        { key: 'booking_type', label: 'Type', type: 'text' },
        { key: 'item_id', label: 'Item ID', type: 'text' },
        { key: 'booking_date', label: 'Date', type: 'date' },
        { key: 'party_size', label: 'Party Size', type: 'number' },
        { key: 'status', label: 'Status', type: 'text' },
        { key: 'total_price', label: 'Total', type: 'currency' }
      ],
      defaultItem: {
        booking_type: 'golf',
        item_id: '',
        booking_date: new Date().toISOString().split('T')[0],
        booking_time: '10:00 AM',
        party_size: 4,
        status: 'confirmed',
        total_price: 0,
        confirmation_code: '',
        customer_info: {
          name: '',
          email: '',
          phone: ''
        },
        special_requests: ''
      }
    },
    users: {
      title: 'Users',
      icon: Users,
      color: 'rose',
      columns: [
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'created_at', label: 'Created', type: 'date' }
      ],
      defaultItem: {
        email: '',
        name: '',
        phone: '',
        created_at: new Date().toISOString()
      }
    }
  };

  // Get current table config
  const currentConfig = tableConfigs[activeTab as keyof typeof tableConfigs];

  // Fetch data when tab changes
  useEffect(() => {
    if (!isAdmin) return;
    
    fetchTableData(activeTab);
  }, [activeTab, isAdmin]);

  // Fetch data from Supabase
  const fetchTableData = async (tableName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setTableData(data || []);
    } catch (err: any) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err.message || `Failed to load ${tableName}`);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const filteredData = tableData.filter(item => {
    if (!searchTerm) return true;
    
    // Search in all string fields
    return Object.entries(item).some(([key, value]) => {
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
  });

  // Handle edit
  const handleEdit = (item: TableData) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const { error } = await supabase
        .from(activeTab)
        .delete()
        .eq('id', itemToDelete);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setTableData(prev => prev.filter(item => item.id !== itemToDelete));
      setSuccessMessage(`Item deleted successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error deleting item:', err);
      setError(err.message || 'Failed to delete item');
    } finally {
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  // Save edited item
  const saveItem = async () => {
    if (!editingItem) return;
    
    try {
      const { error } = await supabase
        .from(activeTab)
        .update(editingItem)
        .eq('id', editingItem.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setTableData(prev => 
        prev.map(item => item.id === editingItem.id ? editingItem : item)
      );
      
      setSuccessMessage('Item updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowEditModal(false);
    } catch (err: any) {
      console.error('Error updating item:', err);
      setError(err.message || 'Failed to update item');
    }
  };

  // Add new item
  const addNewItem = async () => {
    try {
      // Generate a unique ID
      const id = `internal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const itemToAdd = {
        ...currentConfig.defaultItem,
        ...newItem,
        id,
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from(activeTab)
        .insert(itemToAdd);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setTableData(prev => [itemToAdd, ...prev]);
      setSuccessMessage('Item added successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowAddModal(false);
      setNewItem({});
    } catch (err: any) {
      console.error('Error adding item:', err);
      setError(err.message || 'Failed to add item');
    }
  };

  // Handle input change for editing
  const handleEditInputChange = (key: string, value: any) => {
    if (!editingItem) return;
    
    setEditingItem({
      ...editingItem,
      [key]: value
    });
  };

  // Handle input change for new item
  const handleNewItemInputChange = (key: string, value: any) => {
    setNewItem({
      ...newItem,
      [key]: value
    });
  };

  // Format cell value based on type
  const formatCellValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return `$${typeof value === 'number' ? value.toLocaleString() : value}`;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return value;
    }
  };

  // Render input field based on type
  const renderInputField = (key: string, value: any, type: string, onChange: (key: string, value: any) => void) => {
    switch (type) {
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(key, parseFloat(e.target.value) || 0)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );
      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(key, parseFloat(e.target.value) || 0)}
              className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );
      case 'date':
        return (
          <input
            type="date"
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
            onChange={(e) => onChange(key, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );
      case 'array':
        return (
          <input
            type="text"
            value={Array.isArray(value) ? value.join(', ') : value || ''}
            onChange={(e) => onChange(key, e.target.value.split(',').map(item => item.trim()))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Comma-separated values"
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(key, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );
    }
  };

  // Export data to CSV
  const exportToCSV = () => {
    if (!tableData.length) return;
    
    const headers = Object.keys(tableData[0]).join(',');
    const rows = tableData.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab}_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Refresh data
  const refreshData = () => {
    fetchTableData(activeTab);
  };

  if (!isAdmin) {
    return (
      <div className="py-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h2>
            <p className="text-gray-600 mb-6">
              You need administrator privileges to access this section. Please contact the system administrator or sign in with an admin account.
            </p>
            <button
              onClick={() => window.location.href = '#home'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Manage your golf courses, hotels, restaurants, experiences, packages, and bookings.
          </p>
        </div>

        {/* API Health and Data Sync */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ApiHealthMonitor />
          <DataSyncManager />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
            {Object.entries(tableConfigs).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium whitespace-nowrap ${
                    activeTab === key
                      ? `text-${config.color}-600 border-${config.color}-600`
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{config.title}</span>
                </button>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <div className={`p-2 bg-${currentConfig.color}-100 rounded-lg`}>
                  <currentConfig.icon className={`h-5 w-5 text-${currentConfig.color}-600`} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{currentConfig.title}</h2>
                <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm">
                  {filteredData.length} items
                </div>
              </div>

              <div className="flex flex-wrap items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${currentConfig.title.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={refreshData}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>

                <button
                  onClick={exportToCSV}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  title="Export to CSV"
                >
                  <Download className="h-5 w-5" />
                </button>

                <button
                  onClick={() => {
                    setNewItem(currentConfig.defaultItem);
                    setShowAddModal(true);
                  }}
                  className={`bg-${currentConfig.color}-600 hover:bg-${currentConfig.color}-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add {currentConfig.title.slice(0, -1)}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="m-4 p-3 bg-green-100 border border-green-200 text-green-800 rounded-lg flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="m-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading {currentConfig.title.toLowerCase()}...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-8 text-center">
                <div className={`p-4 bg-${currentConfig.color}-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
                  <currentConfig.icon className={`h-8 w-8 text-${currentConfig.color}-600`} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No {currentConfig.title.toLowerCase()} found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? `No results matching "${searchTerm}"` : `There are no ${currentConfig.title.toLowerCase()} in the database yet.`}
                </p>
                <button
                  onClick={() => {
                    setNewItem(currentConfig.defaultItem);
                    setShowAddModal(true);
                  }}
                  className={`bg-${currentConfig.color}-600 hover:bg-${currentConfig.color}-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add {currentConfig.title.slice(0, -1)}</span>
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {currentConfig.columns.map((column) => (
                      <th
                        key={column.key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {currentConfig.columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCellValue(item[column.key], column.type)}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit {currentConfig.title.slice(0, -1)}</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {Object.entries(editingItem).map(([key, value]) => {
                  // Skip id and timestamps
                  if (['id', 'created_at', 'updated_at', 'last_updated'].includes(key)) {
                    return null;
                  }

                  // Find column config if available
                  const column = currentConfig.columns.find(col => col.key === key);
                  const type = column?.type || (typeof value === 'number' ? 'number' : Array.isArray(value) ? 'array' : 'text');
                  
                  return (
                    <div key={key} className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      {renderInputField(key, value, type, handleEditInputChange)}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveItem}
                  className={`px-4 py-2 bg-${currentConfig.color}-600 hover:bg-${currentConfig.color}-700 text-white rounded-lg flex items-center space-x-2 transition-colors`}
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add New {currentConfig.title.slice(0, -1)}</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {Object.entries(currentConfig.defaultItem).map(([key, defaultValue]) => {
                  // Find column config if available
                  const column = currentConfig.columns.find(col => col.key === key);
                  const type = column?.type || (typeof defaultValue === 'number' ? 'number' : Array.isArray(defaultValue) ? 'array' : 'text');
                  const value = newItem[key] !== undefined ? newItem[key] : defaultValue;
                  
                  return (
                    <div key={key} className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      {renderInputField(key, value, type, handleNewItemInputChange)}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewItem}
                  className={`px-4 py-2 bg-${currentConfig.color}-600 hover:bg-${currentConfig.color}-700 text-white rounded-lg flex items-center space-x-2 transition-colors`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add {currentConfig.title.slice(0, -1)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Confirm Deletion</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;