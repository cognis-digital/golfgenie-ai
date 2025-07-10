import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/useReduxState';
import { checkApiConnections } from '../store/slices/apiSlice';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  RefreshCw, 
  Server, 
  Database, 
  Globe, 
  CreditCard, 
  MapPin, 
  Utensils, 
  Building, 
  Search 
} from 'lucide-react';

const ApiHealthMonitor: React.FC = () => {
  const dispatch = useAppDispatch();
  const { status, errors } = useAppSelector(state => state.api);
  const [isChecking, setIsChecking] = useState(false);
  
  useEffect(() => {
    checkApiHealth();
  }, []);
  
  const checkApiHealth = async () => {
    setIsChecking(true);
    try {
      await dispatch(checkApiConnections()).unwrap();
    } catch (error) {
      console.error('Error checking API health:', error);
    } finally {
      setIsChecking(false);
    }
  };
  
  const getApiIcon = (api: string) => {
    switch (api) {
      case 'supabase':
        return <Database className="h-6 w-6" />;
      case 'openai':
        return <Server className="h-6 w-6" />;
      case 'stripe':
        return <CreditCard className="h-6 w-6" />;
      case 'maps':
        return <MapPin className="h-6 w-6" />;
      case 'opentable':
        return <Utensils className="h-6 w-6" />;
      case 'yelp':
        return <Search className="h-6 w-6" />;
      case 'booking':
        return <Building className="h-6 w-6" />;
      default:
        return <Globe className="h-6 w-6" />;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusMessage = (api: string, status: string) => {
    switch (status) {
      case 'connected':
        return `${api.charAt(0).toUpperCase() + api.slice(1)} API is connected and operational`;
      case 'disconnected':
        return `${api.charAt(0).toUpperCase() + api.slice(1)} API is not configured`;
      case 'error':
        return errors[api] || `Error connecting to ${api} API`;
      default:
        return `${api.charAt(0).toUpperCase() + api.slice(1)} API status is unknown`;
    }
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Server className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">API Health Monitor</h2>
              <p className="text-blue-100 text-sm">Real-time status of all integrated services</p>
            </div>
          </div>
          <button
            onClick={checkApiHealth}
            disabled={isChecking}
            className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Check Now'}</span>
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(status).map(([api, status]) => (
            <div key={api} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${getStatusColor(status).split(' ')[0]}`}>
                    {getApiIcon(api)}
                  </div>
                  <h3 className="font-medium text-gray-900 capitalize">{api} API</h3>
                </div>
                {getStatusIcon(status)}
              </div>
              
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {status.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Last checked: {new Date().toLocaleTimeString()}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  {getStatusMessage(api, status)}
                </p>
                
                {status !== 'connected' && (
                  <div className="text-sm">
                    <a 
                      href="#" 
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      onClick={(e) => {
                        e.preventDefault();
                        // This would open a configuration modal in a real app
                        alert(`Configure ${api} API`);
                      }}
                    >
                      Configure {api.charAt(0).toUpperCase() + api.slice(1)} API →
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApiHealthMonitor;