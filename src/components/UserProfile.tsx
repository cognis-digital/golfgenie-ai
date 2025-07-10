import React, { useState } from 'react';
import { User, Settings, LogOut, Edit3, Save, X, Shield, Crown } from 'lucide-react';
import { signOut, updateProfile, isCurrentUserAdmin } from '../lib/auth';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfileProps {
  user: SupabaseUser;
  onSignOut: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onSignOut }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState({
    name: user.user_metadata?.name || '',
    phone: user.user_metadata?.phone || ''
  });

  const isAdmin = isCurrentUserAdmin(user);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await updateProfile(profileData);
      if (error) {
        setError(error);
      } else {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      onSignOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setProfileData({
      name: user.user_metadata?.name || '',
      phone: user.user_metadata?.phone || ''
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-full ${isAdmin ? 'bg-amber-100' : 'bg-emerald-100'}`}>
            {isAdmin ? (
              <Crown className="h-6 w-6 text-amber-600" />
            ) : (
              <User className="h-6 w-6 text-emerald-600" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
              {isAdmin && (
                <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>Admin</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {isAdmin ? 'Administrator account with full system access' : 'Manage your account information'}
            </p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-emerald-600 hover:text-emerald-700 p-2 rounded-lg hover:bg-emerald-50 transition-colors duration-200"
          >
            <Edit3 className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Admin Privileges Notice */}
      {isAdmin && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">Administrator Privileges</h3>
              <p className="text-xs text-amber-700 mt-1">
                You have full access to system administration features, user management, and all platform data.
              </p>
              <div className="mt-2 text-xs text-amber-700">
                <strong>Admin Features:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Manage all user accounts and bookings</li>
                  <li>Access system analytics and reports</li>
                  <li>Modify golf courses, hotels, and restaurant data</li>
                  <li>Configure system settings and integrations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={isAdmin ? 'Administrator' : 'Standard User'}
              disabled
              className={`flex-1 p-3 border border-gray-300 rounded-lg ${
                isAdmin ? 'bg-amber-50 text-amber-800' : 'bg-gray-50 text-gray-600'
              }`}
            />
            {isAdmin && (
              <div className="bg-amber-100 p-3 rounded-lg">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
            )}
          </div>
        </div>

        {/* Email (Read Only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={user.email || ''}
            disabled
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={profileData.name}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter your full name"
            />
          ) : (
            <input
              type="text"
              value={profileData.name || 'Not provided'}
              disabled
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          {isEditing ? (
            <input
              type="tel"
              name="phone"
              value={profileData.phone}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="(555) 123-4567"
            />
          ) : (
            <input
              type="text"
              value={profileData.phone || 'Not provided'}
              disabled
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          )}
        </div>

        {/* Account Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
          <input
            type="text"
            value={new Date(user.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            disabled
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        {/* User ID (Admin Only) */}
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
            <input
              type="text"
              value={user.id}
              disabled
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
            />
          </div>
        )}

        {/* Action Buttons */}
        {isEditing ? (
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              onClick={cancelEdit}
              disabled={isLoading}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        ) : (
          <div className="pt-4">
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoading ? 'Signing Out...' : 'Sign Out'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;