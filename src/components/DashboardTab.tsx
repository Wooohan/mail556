import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Mail, Users, Layers, Activity, CheckCircle2, 
  AlertCircle, Shuffle, Clock, ArrowUpRight, Send, RefreshCw, Sparkles 
} from 'lucide-react';
import { Campaign, GmailAccount, Contact, CampaignLog } from '../types';

interface DashboardTabProps {
  accounts: GmailAccount[];
  contacts: Contact[];
  campaigns: Campaign[];
  onRefreshAll: () => void;
}

export default function DashboardTab({ accounts, contacts, campaigns, onRefreshAll }: DashboardTabProps) {
  const [globalLogs, setGlobalLogs] = useState<CampaignLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch recent global delivery logs
  const fetchGlobalLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/global-logs');
      if (res.ok) {
        const data = await res.json();
        setGlobalLogs(data);
      }
    } catch (err) {
      console.error('Failed fetching global logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchGlobalLogs();
  }, [campaigns]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    onRefreshAll();
    await fetchGlobalLogs();
    setIsRefreshing(false);
  };

  // Calculations for dashboard indicators
  const totalEmailsSent = campaigns.reduce((acc, curr) => acc + (curr.successCount || 0) + (curr.failedCount || 0), 0) +
                         globalLogs.length; // include direct sends
  const totalSuccess = campaigns.reduce((acc, curr) => acc + (curr.successCount || 0), 0) + 
                       globalLogs.filter(l => l.status === 'success').length;
  const totalFailed = campaigns.reduce((acc, curr) => acc + (curr.failedCount || 0), 0) + 
                      globalLogs.filter(l => l.status === 'failed').length;

  const successRate = totalEmailsSent > 0 
    ? Math.round((totalSuccess / totalEmailsSent) * 100) 
    : 100;

  const runningCampaignsCount = campaigns.filter(c => c.status === 'running').length;
  const activeSendersCount = accounts.filter(a => a.status === 'active').length;

  // Let's compute sender rotation loads (how many sends per sender account)
  // This simulates load balances beautifully
  const senderLoads: Record<string, { success: number; failed: number }> = {};
  
  // Initialize from known connected accounts
  accounts.forEach(a => {
    senderLoads[a.email] = { success: 0, failed: 0 };
  });

  // Aggregate from global logs
  globalLogs.forEach(log => {
    if (!senderLoads[log.sender]) {
      senderLoads[log.sender] = { success: 0, failed: 0 };
    }
    if (log.status === 'success') {
      senderLoads[log.sender].success += 1;
    } else {
      senderLoads[log.sender].failed += 1;
    }
  });

  const sortedSenderLoads = Object.entries(senderLoads).sort(
    (a, b) => (b[1].success + b[1].failed) - (a[1].success + a[1].failed)
  );

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black font-display tracking-tight text-gray-950 flex items-center gap-2">
            WORKSPACE DASHBOARD
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time rotational outbox overview, running campaign health indexes, and delivery rates.
          </p>
        </div>
        
        <div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="bg-white hover:bg-gray-50 border border-[#EBEBEF] text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-full transition-all inline-flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Metrics'}</span>
          </button>
        </div>
      </div>

      {/* QUICK HIGHLIGHT CARDS - GRID OF 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* CARD 1: TOTAL DISPATCH */}
        <div className="bg-white border border-[#EBEBEF] rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.02)] flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F2EFFE] flex items-center justify-center text-[#7C5CFC]">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest text-[#96969B] uppercase font-mono">TOTAL DISPATCH</p>
            <h3 className="text-2xl font-black font-display text-gray-950 tracking-tight leading-none mt-1">{totalEmailsSent}</h3>
            <p className="text-[10px] text-gray-400 mt-1">Outbox pacing total</p>
          </div>
        </div>

        {/* CARD 2: DELIVERY RATE */}
        <div className="bg-white border border-[#EBEBEF] rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.02)] flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest text-[#96969B] uppercase font-mono">SUCCESS RATE</p>
            <h3 className="text-2xl font-black font-display text-gray-950 tracking-tight leading-none mt-1">{successRate}%</h3>
            <p className="text-[10px] text-gray-400 mt-1">{totalSuccess} ok • {totalFailed} fail</p>
          </div>
        </div>

        {/* CARD 3: ROTATION NODES */}
        <div className="bg-white border border-[#EBEBEF] rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.02)] flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Shuffle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest text-[#96969B] uppercase font-mono">ACTIVE SENDERS</p>
            <h3 className="text-2xl font-black font-display text-gray-950 tracking-tight leading-none mt-1">{activeSendersCount}</h3>
            <p className="text-[10px] text-gray-400 mt-1">GSuite rotation pool</p>
          </div>
        </div>

        {/* CARD 4: CONTACT BANK */}
        <div className="bg-white border border-[#EBEBEF] rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.02)] flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest text-[#96969B] uppercase font-mono">TOTAL LEADS</p>
            <h3 className="text-2xl font-black font-display text-gray-950 tracking-tight leading-none mt-1">{contacts.length}</h3>
            <p className="text-[10px] text-gray-400 mt-1">Segmented lists</p>
          </div>
        </div>

      </div>

      {/* DETAILED CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMN 1 & 2: RECENT RUNS & SENDER ROTATION LOAD */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ACTIVE SEQUENCE HIGHLIGHTS */}
          <div className="bg-white border border-[#EBEBEF] rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <h3 className="font-display font-black text-gray-950 text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7C5CFC]" /> Active Campaign Sequences
              </h3>
              <span className="text-xs bg-[#F2EFFE] text-[#7C5CFC] font-semibold px-2.5 py-1 rounded-full">
                {runningCampaignsCount} Active
              </span>
            </div>

            {campaigns.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-xs text-gray-400 italic">No campaign configurations registered.</p>
                <p className="text-[10px] text-gray-400 mt-1">Initialize customized email templates to stream real-time paced loops here!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((c) => {
                  const sent = (c.successCount || 0) + (c.failedCount || 0);
                  const total = c.totalContacts || 500;
                  const percent = total > 0 ? Math.round((sent / total) * 100) : 0;
                  
                  return (
                    <div key={c.id} className="border border-[#F0F0F3] bg-gray-50/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            c.status === 'running' ? 'bg-emerald-500 animate-pulse' :
                            c.status === 'paused' ? 'bg-amber-500' : 'bg-gray-400'
                          }`} />
                          <h4 className="font-bold text-gray-900 text-sm">{c.name}</h4>
                        </div>
                        <p className="text-[10px] text-[#8C8C9A] font-mono">
                          Recipient Folder: <span className="font-semibold text-gray-700">{c.contactListName}</span>
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex-1 max-w-xs md:mx-6 space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>Outbox Progress</span>
                          <span className="font-mono font-bold text-gray-700">{percent}% ({sent}/{total})</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#7C5CFC] to-[#9175FE]" style={{ width: `${percent}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center text-xs font-mono text-gray-500 gap-3">
                        <span className="text-emerald-600 font-bold">✓ {c.successCount || 0}</span>
                        <span className="text-red-500 font-bold">✗ {c.failedCount || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SENDER ROTATION BALANCES CARD */}
          <div className="bg-white border border-[#EBEBEF] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <h3 className="font-display font-black text-gray-950 text-base flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-[#7C5CFC]" /> Rotational Sender Node Loads
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">Round-robin balancing index</p>
            </div>

            {accounts.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-6">No authenticated Gmail accounts found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedSenderLoads.map(([email, load]) => {
                  const totalUsed = load.success + load.failed;
                  return (
                    <div key={email} className="bg-[#FAFAFD] border border-[#F0F0F3] rounded-2xl p-3.5 space-y-1.5 hover:border-gray-300 transition-all">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono font-bold text-gray-800 truncate block max-w-[150px]" title={email}>{email}</span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                          Active Loop
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-mono pt-1 text-gray-500">
                        <span>Load Share: <strong className="text-gray-900">{totalUsed} Sent</strong></span>
                        <span className="text-emerald-700">✓ {load.success}</span>
                        <span className="text-red-500">✗ {load.failed}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* COLUMN 3: LIVE RECENT STREAM ACTIONS */}
        <div className="bg-white border border-[#EBEBEF] rounded-3xl p-6 shadow-sm space-y-4 h-[510px] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-50 mb-3">
              <h3 className="font-display font-black text-gray-950 text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#7C5CFC]" /> Live Dispatch logs
              </h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            {/* Scrollable logs */}
            {loadingLogs ? (
              <div className="flex items-center justify-center py-40">
                <div className="w-6 h-6 border-2 border-[#7C5CFC]/20 border-t-[#7C5CFC] rounded-full animate-spin" />
              </div>
            ) : globalLogs.length === 0 ? (
              <div className="text-center py-32 space-y-2">
                <p className="text-xs text-gray-400 italic">No dispatches triggered yet.</p>
                <p className="text-[10px] text-gray-400 max-w-[180px] mx-auto">Emails will populate the stream here dynamically.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1.5">
                {globalLogs.slice(0, 15).map((log) => (
                  <div 
                    key={log.id} 
                    className="p-3 border border-[#F0F0F3] bg-gray-50/30 rounded-xl hover:bg-gray-50/80 transition-all text-[11px] space-y-1 shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-gray-900 block truncate max-w-[130px]">{log.recipient}</span>
                        <span className="text-[9px] text-[#8C8C9A] font-mono leading-none block">Sender: {log.sender}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[9px] font-bold font-mono">
                        {log.status === 'success' ? (
                          <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Sent
                          </span>
                        ) : (
                          <span className="text-red-500 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-0.5" title={log.errorMessage}>
                            <AlertCircle className="w-2.5 h-2.5" /> Error
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-500 truncate text-[10px] italic">"{log.subject}"</p>
                    {log.errorMessage && (
                      <p className="text-red-500 text-[8px] leading-tight font-mono whitespace-pre-wrap bg-red-50/50 p-1 rounded">
                        {log.errorMessage}
                      </p>
                    )}
                    <div className="text-right text-[8px] font-mono text-gray-400 pt-0.5 border-t border-dashed border-gray-100 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-50">
            <p className="text-[10px] text-[#96969B] font-mono text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-[#7C5CFC]" /> Rotator pacing intervals active • 1.5s/tick
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
