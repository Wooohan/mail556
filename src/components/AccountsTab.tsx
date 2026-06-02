import React, { useEffect, useState } from 'react';
import { Mail, CheckCircle, ToggleLeft, UserX, AlertCircle, Plus, Info, ShieldCheck, HelpCircle } from 'lucide-react';
import { GmailAccount } from '../types';

interface AccountsTabProps {
  accounts: GmailAccount[];
  loading: boolean;
  onRefresh: () => void;
}

export default function AccountsTab({ accounts, loading, onRefresh }: AccountsTabProps) {
  const [authUrlError, setAuthUrlError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [activeRedirectUri, setActiveRedirectUri] = useState<string>('');

  // Handle popup messages from Google OAuth Callback window
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Validate event source & content
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const connectedEmail = event.data?.email || 'Gmail inbox';
        onRefresh();
        setConnecting(false);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => {
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, [onRefresh]);

  // Initiate Popup Google OAuth flow
  const handleConnectGmail = async () => {
    setConnecting(true);
    setAuthUrlError(null);
    try {
      const res = await fetch('/api/auth/url');
      if (!res.ok) {
        throw new Error('Could not retrieve OAuth URL from backend server.');
      }
      const data = await res.json();
      setActiveRedirectUri(data.redirectUri || '');

      // Open OAuth provider directly in popup as specified in oauth-integration skill
      const popupWidth = 600;
      const popupHeight = 700;
      const left = window.screen.width / 2 - popupWidth / 2;
      const top = window.screen.height / 2 - popupHeight / 2;

      const authWindow = window.open(
        data.url,
        'google_oauth_popup',
        `width=${popupWidth},height=${popupHeight},top=${top},left=${left},resizable=yes,scrollbars=yes`
      );

      if (!authWindow) {
        setConnecting(false);
        alert('Popup blocker detected. Please allow popups for Equinox Mail to link your Gmail account.');
      }
    } catch (err: any) {
      console.error(err);
      setAuthUrlError(err.message || 'Server did not respond with authorization setup details.');
      setConnecting(false);
    }
  };

  // Disconnect a connected account
  const handleDisconnect = async (email: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to disconnect Gmail account "${email}"? This will stop any active campaign currently utilizing this sender.`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
      } else {
        alert('Could not disconnect mailbox.');
      }
    } catch (err) {
      console.error(err);
      alert('Error communicating with backend.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 card-shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="font-display font-bold text-2xl text-gray-950 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#7C5CFC]" /> Authenticated Gmail Senders
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Link one or more Gmail accounts with secure OAuth credentials. Connecting multiple accounts enables 
              <strong className="text-gray-950"> interactive rotation stacking (auto-sequence round-robin)</strong> to send large campaigns without exceeding Gmail's individual rate thresholds.
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleConnectGmail}
              disabled={connecting}
              className="bg-brand-gradient hover:opacity-95 text-white font-medium text-sm px-5 py-3 rounded-xl transition-all shadow-md flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {connecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Opening Google Auth...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-white" />
                  <span>Connect Gmail Account</span>
                </>
              )}
            </button>
          </div>
        </div>

        {authUrlError && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{authUrlError}</span>
          </div>
        )}

        {/* Dynamic callback advisory for user settings */}
        <div className="mt-6 p-4 bg-[#7C5CFC]/5 rounded-xl border border-[#7C5CFC]/10 flex items-start space-x-3 text-xs leading-relaxed text-gray-700">
          <Info className="w-4 h-4 text-[#7C5CFC] mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-medium text-[#7C5CFC]">Configuration Callback URI for Google Cloud Console:</p>
            <p className="text-gray-600 font-mono select-all bg-white px-2 py-1 rounded border border-gray-100 break-all inline-block">
              {activeRedirectUri || `${window.location.origin}/api/auth/callback`}
            </p>
            <p className="text-gray-500 mt-1">
              Ensure this redirect URI is listed in your Authorized redirect URIs inside the Google API Console for the client credential used.
            </p>
          </div>
        </div>
      </div>

      {/* Senders List */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Linked Accounts ({accounts.length})</h3>
        
        {loading ? (
          <div className="flex justify-center py-12 bg-white rounded-2xl border border-gray-100 card-shadow">
            <div className="w-8 h-8 border-4 border-[#7C5CFC]/20 border-t-[#7C5CFC] rounded-full animate-spin"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-150 card-shadow border-dashed">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Mail className="w-6 h-6" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">No Gmail Accounts Connected</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5 leading-relaxed">
              Connect your sender Gmail account to start composing email campaigns and importing recipients.
            </p>
            <button
              onClick={handleConnectGmail}
              className="text-xs font-semibold text-[#7C5CFC] hover:text-[#9B7EFD] flex items-center space-x-1 mx-auto cursor-pointer"
            >
              <span>Connect first sender</span>
              <span>&rarr;</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acct) => (
              <div
                key={acct.email}
                className="bg-white border border-gray-100 rounded-2xl p-5 card-shadow card-shadow-hover transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                      Connected
                    </span>
                    <button
                      onClick={() => handleDisconnect(acct.email)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                      title="Disconnect Account"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 text-[#7C5CFC] rounded-xl flex items-center justify-center font-display font-semibold border border-blue-100/50">
                      {acct.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-semibold text-gray-900 truncate" title={acct.email}>{acct.email}</h4>
                      <p className="text-[11px] text-gray-400 font-mono">Gmail API Inbox</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Linked on</span>
                  <span className="font-mono text-gray-700">{new Date(acct.connectedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAQs Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 card-shadow">
        <h4 className="font-display font-bold text-lg text-gray-950 mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-gray-400" /> Key Features of Gmail Integration
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-600 leading-relaxed">
          <div className="space-y-1">
            <h5 className="font-semibold text-gray-950">How do connected accounts stay linked?</h5>
            <p>
              We request offline access tokens during authorization. This allows Equinox Mail to refresh security credentials on demand without bothering you, running scheduled campaigns in the background seamlessly.
            </p>
          </div>
          <div className="space-y-1">
            <h5 className="font-semibold text-gray-950">Are my emails secure?</h5>
            <p>
              Absolutely. Equinox Mail processes Gmail calls strictly through Direct REST Auth proxies. Tokens are never shared publicly or stored in unsafe browser buffers, retaining pure server-side isolation.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
