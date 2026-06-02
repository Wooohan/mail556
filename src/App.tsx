import React, { useEffect, useState } from 'react';
import AccountsTab from './components/AccountsTab';
import ContactsTab from './components/ContactsTab';
import CampaignsTab from './components/CampaignsTab';
import DashboardTab from './components/DashboardTab';
import EmailValidationTab from './components/EmailValidationTab';
import { GmailAccount, Contact, Campaign } from './types';
import { Mail, Users, Layers, Send, RefreshCw, Menu, X, LayoutDashboard, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // Set Default to dashboard greeting card
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core database pulled states
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Loading indicator states
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Fetch Accounts list
  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error('Failed fetching Gmail accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Fetch Contacts list
  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error('Failed fetching contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Fetch Campaigns list
  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error('Failed fetching campaigns:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // Reset entire database
  const handleResetAll = async () => {
    try {
      const res = await fetch('/api/reset-all', { method: 'POST' });
      if (res.ok) {
        setAccounts([]);
        setContacts([]);
        setCampaigns([]);
        setActiveTab('accounts');
      }
    } catch (err) {
      console.error('Failed reset operation:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAccounts();
    fetchContacts();
    fetchCampaigns();
  }, []);

  // Poll for live metrics if there are any active campaign running!
  useEffect(() => {
    const hasRunningCampaign = campaigns.some(c => c.status === 'running');
    if (!hasRunningCampaign) return;

    const interval = setInterval(() => {
      fetchCampaigns();
    }, 4000);

    return () => clearInterval(interval);
  }, [campaigns]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Layers },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'accounts', label: 'Accounts', icon: Mail },
    { id: 'validator', label: 'Email Validator', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFD] flex flex-col md:flex-row">
      
      {/* 1. DESKTOP SIDEBAR - Hidden on mobile */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-[#EBEBEF] flex-col justify-between py-8 px-6 shrink-0 h-screen sticky top-0">
        <div className="space-y-8">
          
          {/* Logo brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C5CFC] to-[#9175FE] flex items-center justify-center text-white font-medium shadow-sm">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-black text-lg tracking-tight text-gray-950 flex items-center">
                EQUINOX<span className="text-[#96969B] font-[400] text-sm ml-0.5 tracking-wider">MAIL</span>
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-tab-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'accounts') fetchAccounts();
                    if (item.id === 'contacts' || item.id === 'validator') fetchContacts();
                    if (item.id === 'campaigns' || item.id === 'dashboard') fetchCampaigns();
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#F2EFFE] text-[#7C5CFC] font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C5CFC]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Plan card widget & Reset Data option */}
        <div className="space-y-5">
          {/* Current plan card */}
          <div className="bg-[#7C5CFC] text-white rounded-2xl p-4 space-y-3.5 shadow-sm">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold tracking-widest text-indigo-200 uppercase">CURRENT PLAN</p>
              <h4 className="font-display font-semibold text-sm">Pro Campaigner</h4>
            </div>
            <div className="w-full bg-[#6948EC] h-1 rounded-full overflow-hidden">
              <div className="bg-white h-full w-[70%] rounded-full"></div>
            </div>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset all records? Doing so deletes all campaigns, contacts, and linked sender inboxes.')) {
                handleResetAll();
              }
            }}
            className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors border border-dashed border-red-200 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Developer Reset</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE HEADER - Sticky top */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-[#EBEBEF] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7C5CFC] to-[#9175FE] flex items-center justify-center text-white">
            <Mail className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-gray-950">
            EQUINOX<span className="text-[#96969B] font-[400] text-xs ml-0.5 tracking-wider">MAIL</span>
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded-lg text-gray-500 hover:bg-gray-50"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* MOBILE POPUP NAVIGATION ACCORDION */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[53px] bg-white z-40 p-6 flex flex-col justify-between border-t border-[#EBEBEF]">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                    if (item.id === 'accounts') fetchAccounts();
                    if (item.id === 'contacts' || item.id === 'validator') fetchContacts();
                    if (item.id === 'campaigns' || item.id === 'dashboard') fetchCampaigns();
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#F2EFFE] text-[#7C5CFC]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C5CFC]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="space-y-4">
            <div className="bg-[#7C5CFC] text-white rounded-2xl p-4 space-y-3.5">
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold tracking-widest text-[#D3C7FE] uppercase">CURRENT PLAN</p>
                <h4 className="font-semibold text-sm">Pro Campaigner</h4>
              </div>
              <div className="w-full bg-[#6948EC] h-1 rounded-full overflow-hidden">
                <div className="bg-white h-full w-[70%] rounded-full"></div>
              </div>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Delete all records?')) {
                  handleResetAll();
                  setMobileMenuOpen(false);
                }
              }}
              className="w-full flex items-center justify-center space-x-1.5 px-3 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl border border-dashed border-red-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Full Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTENT */}
      <div className="flex-1 flex flex-col justify-between min-h-screen">
        
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {activeTab === 'dashboard' && (
            <DashboardTab
              accounts={accounts}
              contacts={contacts}
              campaigns={campaigns}
              onRefreshAll={() => {
                fetchAccounts();
                fetchContacts();
                fetchCampaigns();
              }}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsTab
              accounts={accounts}
              loading={loadingAccounts}
              onRefresh={fetchAccounts}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsTab
              contacts={contacts}
              onRefresh={fetchContacts}
            />
          )}

          {activeTab === 'campaigns' && (
            <CampaignsTab
              campaigns={campaigns}
              accounts={accounts}
              contacts={contacts}
              onRefresh={fetchCampaigns}
            />
          )}

          {activeTab === 'validator' && (
            <EmailValidationTab
              contacts={contacts}
              onRefreshContacts={fetchContacts}
            />
          )}

        </main>

        {/* Humanized Literal Footer */}
        <footer className="bg-white border-t border-[#F0F0F3] py-5 text-center text-[11px] text-[#A3A3AF] font-mono mt-12 shrink-0">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <span className="font-semibold text-[#7C5CFC]/85 flex items-center justify-center sm:justify-start gap-1">
              <Send className="w-3 h-3" /> Equinox Mail Setup
            </span>
            <span>© 2026 Equinox Systems — Standard Multi-Account Rotation & Rate Pacing Outbox Manager.</span>
          </div>
        </footer>
      </div>

    </div>
  );
}
