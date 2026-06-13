'use client';

import React, { useState, useEffect } from 'react';
import { User, Shield, Monitor, Globe, Check, Smartphone, LogOut, Loader2 } from 'lucide-react';

interface ProfileUser {
  firstName: string;
  lastName: string;
  email: string;
  roles?: string[];
  preferences?: {
    language: string;
    theme: string;
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSecurity, setSavingSecurity] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    language: 'English (US)',
    theme: 'System Default',
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch('http://localhost:3001/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          language: data.preferences?.language || 'English (US)',
          theme: data.preferences?.theme || 'System Default',
        });
      }
    } catch {
      // profile not loaded
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInfoSubmit = async (updatedFields?: Partial<typeof formData>) => {
    setSaveStatus('saving');
    setMessage(null);
    
    const fieldsToSave = {
      firstName: updatedFields?.hasOwnProperty('firstName') ? updatedFields.firstName : formData.firstName,
      lastName: updatedFields?.hasOwnProperty('lastName') ? updatedFields.lastName : formData.lastName,
      preferences: {
        language: updatedFields?.language ?? formData.language,
        theme: updatedFields?.theme ?? formData.theme,
      }
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/auth/me', {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fieldsToSave)
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('user', JSON.stringify(data));
        window.dispatchEvent(new Event('user-profile-updated'));
        setUser(data);
        setSaveStatus('saved');
      } else {
        const errorData = await res.json();
        setSaveStatus('error');
        let detail = '';
        if (errorData.errors) {
          detail = typeof errorData.errors === 'string' 
            ? errorData.errors 
            : (errorData.errors as Array<{ path?: string[]; message: string }>)
                .map((e) => `${e.path?.join('.') || 'field'}: ${e.message}`).join(', ');
        }
        setMessage({ 
          type: 'error', 
          text: `${errorData.message || 'Failed to update profile.'}${detail ? ' (' + detail + ')' : ''}` 
        });
      }
    } catch (err) {
      setSaveStatus('error');
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: 'error', text: `An unexpected error occurred: ${msg}` });
    }
  };

  const handleSecuritySubmit = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    
    setSavingSecurity(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/auth/me', {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword,
        })
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Password updated successfully.' });
        setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to update password.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSavingSecurity(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in-up">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">User Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your personal information, security, and preferences.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
          {message.text}
        </div>
      )}

      <div className="frappe-grid-2">
        {/* Personal Info */}
        <div className="frappe-card h-fit">
          <div className="frappe-card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={18} className="text-primary" />
              <span>Personal Information</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-normal">
              {saveStatus === 'saving' && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin text-warning" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-success flex items-center gap-1">
                  <Check size={14} className="text-success" />
                  Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-danger flex items-center gap-1">
                  Error
                </span>
              )}
            </div>
          </div>
          <div className="frappe-card-body flex flex-col gap-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex flex-col">
                <button className="frappe-btn frappe-btn-secondary text-xs py-1 px-3">Upload Photo</button>
                <span className="text-xs text-muted-foreground mt-1">JPG, GIF or PNG. Max size of 800K</span>
              </div>
            </div>

            <div className="frappe-grid-2">
              <div className="frappe-form-group">
                <label className="frappe-label">First Name</label>
                <input 
                  className="frappe-input" 
                  value={formData.firstName} 
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                  onBlur={() => handleInfoSubmit()}
                />
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Last Name</label>
                <input 
                  className="frappe-input" 
                  value={formData.lastName} 
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                  onBlur={() => handleInfoSubmit()}
                />
              </div>
            </div>

            <div className="frappe-form-group">
              <label className="frappe-label">Email Address</label>
              <input className="frappe-input bg-muted" defaultValue={user?.email || ''} readOnly />
              <p className="text-xs text-muted-foreground mt-1">Contact your admin to change your email address.</p>
            </div>

            <div className="frappe-form-group">
              <label className="frappe-label">Job Title / Role</label>
              <input className="frappe-input bg-muted" defaultValue={user?.roles?.join(', ') || 'Employee'} readOnly />
            </div>

            <hr className="border-border my-2" />
            
            <div className="frappe-form-group">
              <label className="frappe-label flex items-center gap-2"><Globe size={14}/> Language</label>
              <select 
                className="frappe-input" 
                value={formData.language} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({...prev, language: val}));
                  handleInfoSubmit({ language: val });
                }}
              >
                <option>English (US)</option>
                <option>Spanish (ES)</option>
                <option>French (FR)</option>
              </select>
            </div>
            <div className="frappe-form-group">
              <label className="frappe-label flex items-center gap-2"><Monitor size={14}/> Theme</label>
              <select 
                className="frappe-input" 
                value={formData.theme} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({...prev, theme: val}));
                  handleInfoSubmit({ theme: val });
                  
                  // Instantly apply visual theme update if it's Light or Dark
                  const nextTheme = val === 'Dark Mode' ? 'dark' : val === 'Light Mode' ? 'light' : 'light';
                  document.documentElement.setAttribute('data-theme', nextTheme);
                }}
              >
                <option>System Default</option>
                <option>Light Mode</option>
                <option>Dark Mode</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Authentication */}
        <div className="flex flex-col gap-4">
          <div className="frappe-card">
            <div className="frappe-card-header flex items-center gap-2">
              <Shield size={18} className="text-primary" />
              Security & Authentication
            </div>
            <div className="frappe-card-body flex flex-col gap-4">
              <div className="frappe-form-group">
                <label className="frappe-label">Current Password</label>
                <input 
                  type="password" 
                  className="frappe-input" 
                  placeholder="••••••••" 
                  value={securityData.currentPassword}
                  onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                />
              </div>
              <div className="frappe-grid-2">
                <div className="frappe-form-group">
                  <label className="frappe-label">New Password</label>
                  <input 
                    type="password" 
                    className="frappe-input" 
                    placeholder="••••••••" 
                    value={securityData.newPassword}
                    onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                  />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Confirm Password</label>
                  <input 
                    type="password" 
                    className="frappe-input" 
                    placeholder="••••••••" 
                    value={securityData.confirmPassword}
                    onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <button 
                  className="frappe-btn frappe-btn-secondary"
                  onClick={handleSecuritySubmit}
                  disabled={savingSecurity || !securityData.newPassword}
                >
                  {savingSecurity ? 'Updating...' : 'Update Password'}
                </button>
              </div>

              <hr className="border-border my-2" />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2"><Smartphone size={16}/> Two-Factor Authentication</h4>
                  <p className="text-xs text-muted-foreground mt-1">Add an extra layer of security to your account.</p>
                </div>
                <button className="frappe-btn frappe-btn-primary text-xs py-1 px-3">Enable 2FA</button>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="frappe-card">
            <div className="frappe-card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor size={18} className="text-primary" />
                Active Sessions
              </div>
              <button className="frappe-btn frappe-btn-secondary text-xs py-1 px-3 flex items-center gap-1">
                <LogOut size={14} /> Revoke all others
              </button>
            </div>
            <div className="frappe-card-body p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Device</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">IP Address</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Last Active</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Monitor size={16} className="text-muted-foreground" />
                        <span>Windows • Chrome</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">192.168.1.1</td>
                    <td className="px-4 py-3">Just now</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                        <Check size={12} /> Current
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
