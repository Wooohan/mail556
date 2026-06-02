import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, CheckCircle2, AlertCircle, AlertTriangle, 
  Trash2, Upload, Plus, CheckSquare, Mail, Layers, FileText, 
  FolderPlus, RefreshCw, Filter, ArrowUpRight
} from 'lucide-react';
import { Contact } from '../types';

interface EmailValidationTabProps {
  contacts: Contact[];
  onRefreshContacts: () => void;
}

interface ValidatedItem {
  id: string;
  email: string;
  status: 'valid' | 'risky' | 'invalid';
  reason: string;
  domain: string;
  selected: boolean;
}

const COMMON_DISPOSABLE_DOMAINS = [
  'mailinator.com', 'yopmail.com', 'temp-mail.org', 'tempmail.com', 
  'dispostable.com', 'guerrillamail.com', 'sharklasers.com', '10minutemail.com',
  'trashmail.com', 'getairmail.com', 'temp-mail.com', 'tempmail.net'
];

const COMMON_ROLE_PREFIXES = [
  'admin', 'support', 'sales', 'info', 'contact', 'jobs', 'careers',
  'billing', 'team', 'hello', 'marketing', 'press', 'office', 'help',
  'service', 'staff', 'hr', 'media', 'enquiry', 'enquiries'
];

export default function EmailValidationTab({ contacts, onRefreshContacts }: EmailValidationTabProps) {
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState<ValidatedItem[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  
  // Save Contacts Group state
  const [targetGroup, setTargetGroup] = useState('Validated Leads');
  const [newGroupNameInput, setNewGroupNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ status: 'success' | 'error'; text: string } | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'risky' | 'invalid'>('all');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get distinct group names from existing contacts
  const existingGroups = Array.from(new Set(contacts.map(c => c.listName))).filter(Boolean);

  // High-fidelity local email validation algorithm
  const validateEmail = (rawEmail: string): ValidatedItem => {
    const email = rawEmail.trim();
    const id = Math.random().toString(36).substr(2, 9);
    
    if (!email) {
      return { id, email: '', status: 'invalid', reason: 'Empty row', domain: '', selected: false };
    }

    // Syntax check using standard RFC-like regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return {
        id,
        email,
        status: 'invalid',
        reason: 'Malformed address structure',
        domain: '',
        selected: false
      };
    }

    const parts = email.split('@');
    const localPart = parts[0].toLowerCase();
    const domain = parts[1].toLowerCase();

    // Check Disposable Domain
    if (COMMON_DISPOSABLE_DOMAINS.includes(domain)) {
      return {
        id,
        email,
        status: 'risky',
        reason: 'Temporary/disposable inbox domain',
        domain,
        selected: true
      };
    }

    // Check Role-based address prefix
    if (COMMON_ROLE_PREFIXES.includes(localPart)) {
      return {
        id,
        email,
        status: 'risky',
        reason: 'Role-based account (not personal)',
        domain,
        selected: true
      };
    }

    // Passed syntax and risk scans -> Valid!
    return {
      id,
      email,
      status: 'valid',
      reason: 'Perfect deliverability syntax verified',
      domain,
      selected: true
    };
  };

  // Perform core validation loop
  const handleValidate = async () => {
    if (!inputText.trim()) return alert('Please paste some email addresses first.');
    setIsValidating(true);
    setSaveMessage(null);

    // Split by lines, commas, or semicolons
    const rawList = inputText.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    
    try {
      const res = await fetch('/api/validate-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: rawList })
      });

      if (res.ok) {
        const validated = await res.json();
        setItems(validated);
      } else {
        const errorText = await res.text();
        alert(`Validation server error: ${errorText || 'Server offline or invalid format'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert('Network or backend gateway connection failure.');
    } finally {
      setIsValidating(false);
    }
  };

  // Handle txt/csv file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInputText(text);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // reset
  };

  // Select all or deselect all helper
  const toggleSelectAll = (val: boolean) => {
    setItems(prev => prev.map(item => ({ ...item, selected: val })));
  };

  const toggleSelectItem = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  // Clear list
  const handleClearList = () => {
    setItems([]);
    setInputText('');
    setSaveMessage(null);
  };

  // Save selected list items to database group
  const handleSaveToContactsGroup = async () => {
    const selectedItems = items.filter(item => item.selected && item.email);
    if (selectedItems.length === 0) {
      return alert('No verified contacts are currently selected.');
    }

    const finalGroupName = targetGroup === '__NEW__' 
      ? (newGroupNameInput.trim() || 'New Validated Group') 
      : targetGroup;

    setIsSaving(true);
    setSaveMessage(null);

    // Format target contacts schema
    const contactsToSave = selectedItems.map(item => ({
      id: item.id,
      email: item.email,
      name: item.email.split('@')[0], // Use local part as fallback name
      listName: finalGroupName,
      createdAt: new Date().toISOString()
    }));

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactsToSave)
      });

      if (res.ok) {
        setSaveMessage({
          status: 'success',
          text: `Successfully imported ${contactsToSave.length} leads into folder: "${finalGroupName}"!`
        });
        // Call parent reload to update metrics
        onRefreshContacts();
      } else {
        setSaveMessage({
          status: 'error',
          text: 'Failed to write validation rows to Contact DB.'
        });
      }
    } catch (err: any) {
      console.error(err);
      setSaveMessage({
        status: 'error',
        text: err.message || 'Server connection error.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered dataset views
  const filteredItems = items.filter(val => {
    if (statusFilter === 'all') return true;
    return val.status === statusFilter;
  });

  // Totals calculations
  const totalScanned = items.length;
  const countValid = items.filter(i => i.status === 'valid').length;
  const countRisky = items.filter(i => i.status === 'risky').length;
  const countInvalid = items.filter(i => i.status === 'invalid').length;
  const countSelected = items.filter(i => i.selected).length;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black font-display tracking-tight text-gray-950 flex items-center gap-2">
            EMAIL VALIDATOR
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Bulk parse addresses to filter temp/disposable emails, role-based records, syntax integrity issues, and save cleanly to folders.
          </p>
        </div>
      </div>

      {/* DASH SUMMARY STRIP */}
      {totalScanned > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-5 border border-[#EBEBEF] rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.01)] animate-fade-in">
          <div>
            <span className="text-[9px] font-bold text-gray-400 font-mono tracking-widest block uppercase">SCANNED TOTAL</span>
            <div className="text-xl font-black text-gray-900 mt-1 flex items-center gap-1.5 leading-none">
              <FileText className="w-4 h-4 text-gray-500" /> {totalScanned}
            </div>
          </div>
          <div>
            <span className="text-[9px] font-bold text-emerald-600 font-mono tracking-widest block uppercase">SYNTAX VALID</span>
            <div className="text-xl font-black text-emerald-600 mt-1 flex items-center gap-1.5 leading-none">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {countValid}
            </div>
          </div>
          <div>
            <span className="text-[9px] font-bold text-amber-500 font-mono tracking-widest block uppercase">RISKY / ROLE</span>
            <div className="text-xl font-black text-amber-500 mt-1 flex items-center gap-1.5 leading-none">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> {countRisky}
            </div>
          </div>
          <div>
            <span className="text-[9px] font-bold text-red-500 font-mono tracking-widest block uppercase">INVALID SYNTAX</span>
            <div className="text-xl font-black text-red-500 mt-1 flex items-center gap-1.5 leading-none">
              <AlertCircle className="w-4 h-4 text-red-400" /> {countInvalid}
            </div>
          </div>
        </div>
      )}

      {/* INPUT EDITOR AND ACTIONS SEPARATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* INPUT PANEL CONTAINER */}
        <div className="lg:col-span-2 bg-white p-6 border border-[#EBEBEF] rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.015)] space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-50">
            <h3 className="font-display font-black text-gray-950 text-base">
              Paste Recipients List
            </h3>
            
            {/* CSV File Trigger */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.csv"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer font-medium inline-flex items-center gap-1.5"
              >
                <Upload className="w-3 h-3" />
                <span>Upload TXT/CSV</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-mono uppercase font-black tracking-wider">
              Inbox Addresses (One per line, comma or semicolon separated)
            </label>
            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="recipient1@domain.com&#10;recipient2@mailinator.com&#10;support@corporate.com"
              className="w-full bg-[#FAFAFD] border border-[#EBEBEF] rounded-2xl p-4 text-xs font-mono focus:outline-none focus:border-[#7C5CFC] resize-none leading-relaxed"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={handleClearList}
              className="text-xs text-gray-400 hover:text-red-500 font-medium px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Clear Workspace
            </button>
            
            <button
              onClick={handleValidate}
              disabled={isValidating || !inputText.trim()}
              className="bg-gradient-to-r from-[#7C5CFC] to-[#9175FE] hover:opacity-95 text-white font-semibold text-xs px-8 py-3 rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 border-0"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning Records...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verify Email Set</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SAVE TO CONTACT GROUP CONTROLS (Only visible when items scanned) */}
        <div className="bg-white p-6 border border-[#EBEBEF] rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.015)] space-y-4">
          <h3 className="font-display font-black text-gray-950 text-base pb-2 border-b border-gray-50 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-[#7C5CFC]" /> Save Import Settings
          </h3>

          <div className="space-y-4">
            
            {/* Target Group Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-mono uppercase font-bold tracking-wider block">
                Destination Group/Folder
              </label>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full bg-[#FAFAFD] border border-[#EBEBEF] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#7C5CFC] cursor-pointer"
              >
                <option value="Validated Leads">Validated Leads (Default)</option>
                {existingGroups.map(gp => (
                  <option key={gp} value={gp}>{gp}</option>
                ))}
                <option value="__NEW__">+ Create Brand New Folder</option>
              </select>
            </div>

            {/* If New Group is requested */}
            {targetGroup === '__NEW__' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[10px] text-gray-400 font-mono uppercase font-bold tracking-wider block">
                  New Group Folder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Validated Senders"
                  value={newGroupNameInput}
                  onChange={(e) => setNewGroupNameInput(e.target.value)}
                  className="w-full bg-[#FAFAFD] border border-[#EBEBEF] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#7C5CFC]"
                />
              </div>
            )}

            {/* Select counters info */}
            <div className="bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100 text-xs text-gray-500 space-y-1.5">
              <div className="flex justify-between">
                <span>Total Validated List:</span>
                <strong className="text-gray-800">{totalScanned}</strong>
              </div>
              <div className="flex justify-between">
                <span>Selected to Import:</span>
                <strong className="text-gray-800 text-[#7C5CFC]">{countSelected} / {totalScanned}</strong>
              </div>
            </div>

            {/* Save feedback */}
            {saveMessage && (
              <div className={`p-3.5 rounded-xl text-xs ${
                saveMessage.status === 'success' 
                  ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' 
                  : 'bg-red-50 border border-red-100 text-red-800'
              }`}>
                {saveMessage.text}
              </div>
            )}

            <button
              onClick={handleSaveToContactsGroup}
              disabled={isSaving || totalScanned === 0 || countSelected === 0}
              className="w-full bg-[#111827] hover:bg-black text-white font-bold text-xs py-3 rounded-full transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 border-0"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Inserting Leads...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Import in Contacts Database</span>
                </>
              )}
            </button>

          </div>
        </div>

      </div>

      {/* FILTERABLE PARSE LIST (Shown if emails scanned) */}
      {totalScanned > 0 && (
        <div className="bg-white border border-[#EBEBEF] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-50">
            <div>
              <h3 className="font-display font-black text-gray-950 text-base">
                Verifications Table View
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Check/uncheck rows below to control what imports into your folder.</p>
            </div>

            {/* Grid Filters */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-mono uppercase inline-flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50/50 p-1">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-colors ${
                    statusFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  All ({totalScanned})
                </button>
                <button
                  onClick={() => setStatusFilter('valid')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-colors ${
                    statusFilter === 'valid' ? 'bg-emerald-500 text-white shadow-sm' : 'text-emerald-500/80 hover:text-emerald-600'
                  }`}
                >
                  Valid ({countValid})
                </button>
                <button
                  onClick={() => setStatusFilter('risky')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-colors ${
                    statusFilter === 'risky' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-500/80 hover:text-amber-600'
                  }`}
                >
                  Risky ({countRisky})
                </button>
                <button
                  onClick={() => setStatusFilter('invalid')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-colors ${
                    statusFilter === 'invalid' ? 'bg-red-500 text-white shadow-sm' : 'text-red-500/80 hover:text-red-600'
                  }`}
                >
                  Invalid ({countInvalid})
                </button>
              </div>
            </div>
          </div>

          {/* Table headers */}
          <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 uppercase tracking-wider py-1 select-none">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSelectAll(true)}
                className="text-[#7C5CFC] hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span>|</span>
              <button
                type="button"
                onClick={() => toggleSelectAll(false)}
                className="text-gray-500 hover:underline cursor-pointer"
              >
                None
              </button>
            </div>
            <span>Verification Status Check</span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredItems.length === 0 ? (
              <div className="text-center py-10 text-xs italic text-gray-400">
                No addresses match this filter index.
              </div>
            ) : (
              filteredItems.map(item => (
                <div 
                  key={item.id} 
                  className={`p-3.5 border rounded-2xl flex items-center justify-between gap-4 transition-all ${
                    item.selected ? 'bg-white border-gray-200' : 'bg-gray-50/10 border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-4 h-4 text-[#7C5CFC] rounded border-gray-300 focus:ring-[#7C5CFC] cursor-pointer"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-gray-950 font-mono text-xs block truncate">{item.email}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5 block truncate italic">
                        {item.reason} {item.domain && `• Server: ${item.domain}`}
                      </span>
                    </div>
                  </div>

                  <div>
                    {item.status === 'valid' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" /> Syntax Ok
                      </span>
                    )}
                    {item.status === 'risky' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                        <AlertTriangle className="w-3 h-3" /> Risky / Role
                      </span>
                    )}
                    {item.status === 'invalid' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-red-50 text-red-600 border border-red-100">
                        <AlertCircle className="w-3 h-3" /> Invalid Structure
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
