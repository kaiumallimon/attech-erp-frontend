'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Spinner, Skeleton } from '@heroui/react';
import {
  Mail,
  Send,
  Sparkles,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Plus,
  Trash2,
  Eye,
  RotateCcw,
  RefreshCw,
  Clock,
  Download,
  Image as ImageIcon,
  Link as LinkIcon,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Smartphone,
  Laptop,
  Check,
  X,
  Palette,
  ExternalLink,
  Code,
  ShieldCheck,
  MousePointerClick,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../../context/auth-context';
import { newsletterApi, cdnApi } from '../../../lib/api';
import {
  NewsletterCampaign,
  NewsletterSubscriber,
  NewsletterStats,
  CreateCampaignPayload,
  CdnResourceItem,
} from '../../../types/auth';
import { HeroSelect, SelectOption } from '../../../components/ui/hero-select';

const AUDIENCE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Active Subscribers' },
  { value: 'portfolio', label: 'Portfolio Website Leads' },
  { value: 'careers', label: 'Careers Portal Applicants' },
  { value: 'manual', label: 'Manual & Direct Imports' },
];

const INITIAL_EMAIL_HTML = '';

export default function NewsletterPage() {
  const { user, isSuperAdmin, isAdmin } = useAuth();

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState<'composer' | 'history' | 'subscribers'>('composer');

  // Telemetry & Data States
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Campaigns State
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState('');

  // Subscribers State
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isSubscribersLoading, setIsSubscribersLoading] = useState(false);
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [subscriberSourceFilter, setSubscriberSourceFilter] = useState('all');

  // Composer Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [senderName, setSenderName] = useState('AtTech Solutions');
  const [senderEmail, setSenderEmail] = useState('newsletter@attech.io');
  const [targetAudience, setTargetAudience] = useState('all');
  const [htmlContent, setHtmlContent] = useState('');

  // Editor Visual State
  const editorRef = useRef<HTMLDivElement>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isSending, setIsSending] = useState(false);

  // Modals State
  const [isTestEmailModalOpen, setIsTestEmailModalOpen] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState(user?.email || 'admin@attech.io');
  const [isBroadcastConfirmModalOpen, setIsBroadcastConfirmModalOpen] = useState(false);
  const [isAddSubscriberModalOpen, setIsAddSubscriberModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isInspectCampaignModalOpen, setIsInspectCampaignModalOpen] = useState(false);
  const [inspectCampaign, setInspectCampaign] = useState<NewsletterCampaign | null>(null);

  // Modal Input Fields
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubSource, setNewSubSource] = useState('manual');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageWidth, setImageWidth] = useState('100%');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [cdnAssets, setCdnAssets] = useState<CdnResourceItem[]>([]);
  const [isLoadingCdn, setIsLoadingCdn] = useState(false);

  // Toast State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Fetch Telemetry Stats
  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const res = await newsletterApi.getStats();
      setStats(res);
    } catch (err: any) {
      console.error('Failed to fetch newsletter stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Fetch Campaigns History
  const fetchCampaigns = useCallback(async () => {
    setIsCampaignsLoading(true);
    try {
      const res = await newsletterApi.listCampaigns({ search: campaignSearch || undefined });
      setCampaigns(res.data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch campaigns history', 'error');
    } finally {
      setIsCampaignsLoading(false);
    }
  }, [campaignSearch]);

  // Fetch Subscribers
  const fetchSubscribers = useCallback(async () => {
    setIsSubscribersLoading(true);
    try {
      const res = await newsletterApi.listSubscribers({
        search: subscriberSearch || undefined,
        source: subscriberSourceFilter !== 'all' ? subscriberSourceFilter : undefined,
      });
      setSubscribers(res.data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch subscribers', 'error');
    } finally {
      setIsSubscribersLoading(false);
    }
  }, [subscriberSearch, subscriberSourceFilter]);

  // Fetch CDN assets for image selector
  const fetchCdnAssets = useCallback(async () => {
    setIsLoadingCdn(true);
    try {
      const res = await cdnApi.getResources({ maxResults: 12 });
      setCdnAssets(res.data || []);
    } catch (err) {
      console.error('Failed to load CDN assets:', err);
    } finally {
      setIsLoadingCdn(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'history') fetchCampaigns();
    if (activeTab === 'subscribers') fetchSubscribers();
  }, [activeTab, fetchCampaigns, fetchSubscribers]);

  // Rich Text Editor Commands (execCommand with HTML sync)
  const execFormat = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    if (command === 'formatBlock') {
      const tag = value || 'p';
      document.execCommand('formatBlock', false, tag.startsWith('<') ? tag : `<${tag}>`);
    } else {
      document.execCommand(command, false, value);
    }
    setHtmlContent(editorRef.current.innerHTML);
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  // Insert Custom Component Blocks
  const insertComponentBlock = (type: 'cta' | 'callout' | 'divider' | 'hero') => {
    if (!editorRef.current) return;
    let blockHtml = '';

    if (type === 'cta') {
      blockHtml = `<div style="text-align: center; margin: 24px 0;">
  <a href="https://at-tech.tech" class="cta-button" style="display: inline-block; background-color: #0B2E23; color: #FFFFFF !important; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 9999px; text-decoration: none !important;">
    Explore Feature Now →
  </a>
</div><p></p>`;
    } else if (type === 'callout') {
      blockHtml = `<div class="callout-box" style="background-color: #F3F4F6; border-left: 4px solid #0B2E23; padding: 16px 20px; border-radius: 12px; margin: 20px 0; font-size: 14px;">
  <strong>💡 Executive Highlight:</strong> Add key takeaways or promotional highlights here.
</div><p></p>`;
    } else if (type === 'divider') {
      blockHtml = `<hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 28px 0;" /><p></p>`;
    } else if (type === 'hero') {
      blockHtml = `<div style="background-color: #0B251A; color: #FFFFFF; padding: 24px; border-radius: 16px; margin: 20px 0; text-align: center;">
  <h2 style="color: #FFFFFF; margin: 0 0 8px 0;">Special Announcement</h2>
  <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 13px;">Exclusive insights and product advancements from AtTech Solutions.</p>
</div><p></p>`;
    }

    document.execCommand('insertHTML', false, blockHtml);
    setHtmlContent(editorRef.current.innerHTML);
  };

  // Insert Image into Editor
  const handleInsertImage = () => {
    if (!imageUrl.trim() || !editorRef.current) return;
    const styleWidth = imageWidth === '100%' ? 'width: 100%; max-width: 100%;' : `width: ${imageWidth};`;
    const imgHtml = `<div style="text-align: center; margin: 20px 0;">
  <img src="${imageUrl.trim()}" alt="${imageAlt || 'AtTech Newsletter Asset'}" style="${styleWidth} height: auto; border-radius: 16px; display: inline-block;" />
  ${imageAlt ? `<p style="font-size: 11px; color: #6B7280; margin-top: 6px; font-style: italic;">${imageAlt}</p>` : ''}
</div><p></p>`;

    document.execCommand('insertHTML', false, imgHtml);
    setHtmlContent(editorRef.current.innerHTML);
    setIsImageModalOpen(false);
    setImageUrl('');
    setImageAlt('');
    showToast('Image inserted successfully into newsletter.');
  };

  // Insert Hyperlink
  const handleInsertLink = () => {
    if (!linkUrl.trim() || !editorRef.current) return;
    const linkHtml = `<a href="${linkUrl.trim()}" target="_blank" style="color: #0B2E23; font-weight: 600; text-decoration: underline;">${linkText.trim() || linkUrl.trim()}</a>`;
    document.execCommand('insertHTML', false, linkHtml);
    setHtmlContent(editorRef.current.innerHTML);
    setIsLinkModalOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Send Test Email
  const handleSendTestEmail = async () => {
    if (!testEmailRecipient.trim()) {
      showToast('Please enter a recipient email for test dispatch', 'error');
      return;
    }

    setIsSending(true);
    try {
      // 1. Create temporary draft
      const draft = await newsletterApi.createCampaign({
        title: `[TEST DRAFT] ${title}`,
        subject,
        preheader,
        senderName,
        senderEmail,
        htmlContent,
        targetAudience,
      });

      // 2. Dispatch test email
      await newsletterApi.sendTestEmail(draft._id, testEmailRecipient.trim());
      showToast(`Test email successfully dispatched to ${testEmailRecipient}`);
      setIsTestEmailModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch test email', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Broadcast Campaign
  const handleBroadcastCampaign = async () => {
    setIsSending(true);
    try {
      // 1. Create campaign record
      const draft = await newsletterApi.createCampaign({
        title,
        subject,
        preheader,
        senderName,
        senderEmail,
        htmlContent,
        targetAudience,
      });

      // 2. Broadcast to subscribers
      const result = await newsletterApi.broadcastCampaign(draft._id);
      const recipientCount = (result as any).recipientCount || (result as any).data?.recipientCount || 0;
      const sentCount = (result as any).sentCount || (result as any).data?.sentCount || 0;
      showToast(`Newsletter broadcasted to ${recipientCount} subscribers! (${sentCount} delivered)`);
      setIsBroadcastConfirmModalOpen(false);
      fetchStats();
      setActiveTab('history');
    } catch (err: any) {
      showToast(err.message || 'Failed to broadcast newsletter', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Add Subscriber
  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubEmail.trim()) return;

    try {
      await newsletterApi.addSubscriber({
        email: newSubEmail.trim(),
        name: newSubName.trim() || undefined,
        source: newSubSource,
      });
      showToast(`Subscriber '${newSubEmail}' added successfully.`);
      setIsAddSubscriberModalOpen(false);
      setNewSubEmail('');
      setNewSubName('');
      fetchSubscribers();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to add subscriber', 'error');
    }
  };

  // Export Subscribers CSV
  const handleExportSubscribers = () => {
    if (subscribers.length === 0) {
      showToast('No subscribers to export', 'error');
      return;
    }
    const header = 'Email,Name,Source,Status,SubscribedAt\n';
    const rows = subscribers
      .map((s) => `"${s.email}","${s.name || ''}","${s.source}","${s.status}","${s.subscribedAt}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-3xl border flex items-center justify-between text-xs font-semibold animate-fadeIn shadow-md ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="size-4 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HEADER & WORKSPACE TABS                                                   */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight flex items-center gap-2.5">
            <Mail className="size-6 text-[#0B2E23]" />
            <span>Newsletter & Email Marketing Campaigns</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Compose rich promotional emails with Gmail-compatible CDN media, send test dispatches, and manage audience subscribers
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('composer')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
              activeTab === 'composer'
                ? 'bg-[#0B2E23] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Email Composer
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
              activeTab === 'history'
                ? 'bg-[#0B2E23] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Campaigns History
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subscribers')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
              activeTab === 'subscribers'
                ? 'bg-[#0B2E23] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Subscribers ({stats?.activeSubscribers || 0})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. UNIFIED WARM-TONED TELEMETRY STAT CARD                                 */}
      {/* ========================================================================= */}
      <Card className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
          {/* Segment 1: Active Audience */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#E8734A]/15 text-[#C44D25] shrink-0 border border-[#E8734A]/25">
              <Users className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">Active Audience</p>
              <p className="text-xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : (stats?.activeSubscribers || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-[#A39989]">
                {stats?.totalSubscribers || 0} total registered
              </p>
            </div>
          </div>

          {/* Segment 2: Delivery Integrity */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#5E7A68]/15 text-[#3D5A47] shrink-0 border border-[#5E7A68]/25">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-0.5 w-full">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">Delivery Rate</p>
              <p className="text-xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : `${stats?.deliveryRate || 100}%`}
              </p>
              <div className="w-24 h-1.5 bg-[#ECE5DA] rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-[#5E7A68] rounded-full"
                  style={{ width: `${Math.min(stats?.deliveryRate || 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Segment 3: Campaigns Dispatched */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#D4983D]/15 text-[#A66C15] shrink-0 border border-[#D4983D]/25">
              <Send className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">Broadcasts Sent</p>
              <p className="text-xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : stats?.totalCampaigns || 0}
              </p>
              <p className="text-[11px] text-[#A39989]">Dispatched campaigns</p>
            </div>
          </div>

          {/* Segment 4: Total Emails Delivered */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#7D5B8C]/15 text-[#5C3A6B] shrink-0 border border-[#7D5B8C]/25">
              <Sparkles className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">Emails Delivered</p>
              <p className="text-xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : (stats?.totalDelivered || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-[#A39989]">Cumulative impressions</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* TAB 1: RICH WYSIWYG NEWSLETTER COMPOSER & SPLIT PREVIEW                   */}
      {/* ========================================================================= */}
      {activeTab === 'composer' && (
        <div className="space-y-6">
          {/* Header Metadata Bar */}
          <Card className="p-5 bg-white border border-[#E5E7EB] rounded-4xl shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Campaign Title */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Internal Campaign Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Release Announcement"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              {/* Subject Line */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Email Subject Line (Inbox Headline)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. 🚀 Exciting Updates from AtTech Solutions"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#0B2E23] focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              {/* Preheader Snippet */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Preheader Snippet (Preview text)
                </label>
                <input
                  type="text"
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  placeholder="e.g. Read about our latest infrastructure upgrades..."
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] text-xs font-medium focus:outline-none focus:border-[#0B2E23]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[#E5E7EB]/70 text-xs">
              <div>
                <label className="text-[10.5px] font-bold text-slate-400 block mb-1">Sender Name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-bold text-slate-400 block mb-1">Sender Reply Email</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium font-mono"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-bold text-slate-400 block mb-1">Target Audience</label>
                <HeroSelect
                  value={targetAudience}
                  onChange={(val) => setTargetAudience(val)}
                  options={AUDIENCE_OPTIONS}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* WYSIWYG Workspace: Editor & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Rich Text Editor */}
            <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden flex flex-col h-[700px]">
              {/* Formatting Toolbar */}
              <div className="p-3 border-b border-[#E5E7EB] bg-[#FAFAF9] flex flex-wrap items-center gap-1.5 shrink-0">
                {/* Headings */}
                <div className="flex items-center bg-white rounded-lg border border-[#E5E7EB] p-0.5">
                  <button
                    type="button"
                    onClick={() => execFormat('formatBlock', '<h1>')}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                    title="Heading 1"
                  >
                    <Heading1 className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('formatBlock', '<h2>')}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                    title="Heading 2"
                  >
                    <Heading2 className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('formatBlock', '<h3>')}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                    title="Heading 3"
                  >
                    <Heading3 className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('formatBlock', '<p>')}
                    className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded"
                    title="Paragraph"
                  >
                    P
                  </button>
                </div>

                {/* Inline Formatting */}
                <div className="flex items-center bg-white rounded-lg border border-[#E5E7EB] p-0.5">
                  <button
                    type="button"
                    onClick={() => execFormat('bold')}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                    title="Bold"
                  >
                    <Bold className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('italic')}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                    title="Italic"
                  >
                    <Italic className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('underline')}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                    title="Underline"
                  >
                    <Underline className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('strikeThrough')}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                    title="Strikethrough"
                  >
                    <Strikethrough className="size-4" />
                  </button>
                </div>

                {/* Lists & Alignment */}
                <div className="flex items-center bg-white rounded-lg border border-[#E5E7EB] p-0.5">
                  <button
                    type="button"
                    onClick={() => execFormat('insertUnorderedList')}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                    title="Bullet List"
                  >
                    <List className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('insertOrderedList')}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                    title="Numbered List"
                  >
                    <ListOrdered className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('justifyLeft')}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                    title="Align Left"
                  >
                    <AlignLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat('justifyCenter')}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                    title="Align Center"
                  >
                    <AlignCenter className="size-4" />
                  </button>
                </div>

                {/* Media & Links */}
                <div className="flex items-center bg-white rounded-lg border border-[#E5E7EB] p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      fetchCdnAssets();
                      setIsImageModalOpen(true);
                    }}
                    className="p-1.5 rounded hover:bg-emerald-50 text-[#0B2E23] font-bold flex items-center gap-1 text-xs"
                    title="Insert Cloudinary CDN Image"
                  >
                    <ImageIcon className="size-4 text-emerald-700" />
                    <span>Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(true)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                    title="Insert Hyperlink"
                  >
                    <LinkIcon className="size-4" />
                  </button>
                </div>

                {/* Quick Pre-built Blocks */}
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    type="button"
                    onClick={() => insertComponentBlock('cta')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0B2E23] text-[11px] font-bold border border-emerald-200 transition-colors"
                    title="Insert CTA Button"
                  >
                    + Button
                  </button>
                  <button
                    type="button"
                    onClick={() => insertComponentBlock('callout')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                    title="Insert Callout Box"
                  >
                    + Callout
                  </button>
                  <button
                    type="button"
                    onClick={() => insertComponentBlock('divider')}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                    title="Insert Divider"
                  >
                    —
                  </button>
                </div>
              </div>

              {/* Editable Content Canvas */}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                dangerouslySetInnerHTML={{ __html: INITIAL_EMAIL_HTML }}
                data-placeholder="Start typing your promotional email here... Use the toolbar above to add headings, formatting, and Cloudinary CDN images."
                className="flex-1 p-6 overflow-y-auto focus:outline-none email-editor-canvas max-w-none text-slate-800 text-sm leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:italic"
                style={{ minHeight: '300px' }}
              />
            </Card>

            {/* Column 2: Live Responsive Gmail Preview */}
            <Card className="bg-slate-100 border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden flex flex-col h-[700px]">
              {/* Preview Header Bar */}
              <div className="p-3.5 border-b border-[#E5E7EB] bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-700">Gmail / Outlook Live Preview</span>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-full border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('desktop')}
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      previewMode === 'desktop' ? 'bg-white text-[#0B2E23] shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    <Laptop className="size-3.5" />
                    <span>Desktop (600px)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      previewMode === 'mobile' ? 'bg-white text-[#0B2E23] shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    <Smartphone className="size-3.5" />
                    <span>Mobile (375px)</span>
                  </button>
                </div>
              </div>

              {/* Rendered Email Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-start justify-center bg-[#F3F4F6]">
                <div
                  className={`bg-white rounded-3xl border border-[#E5E7EB] shadow-md overflow-hidden transition-all duration-300 ${
                    previewMode === 'desktop' ? 'w-full max-w-[560px]' : 'w-[375px]'
                  }`}
                >
                  {/* Email Header */}
                  <div className="bg-[#0B251A] p-6 text-white text-left">
                    <div className="text-lg font-extrabold tracking-tight">
                      <span className="text-[#AEFF48]">●</span> AtTech Solutions
                    </div>
                    <div className="text-[10px] text-white/70 uppercase tracking-wider mt-1">
                      {senderName}
                    </div>
                  </div>

                  {/* Body Content */}
                  {htmlContent ? (
                    <div
                      className="p-6 text-slate-800 text-sm leading-relaxed email-preview-canvas"
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                  ) : (
                    <div className="p-12 text-center text-slate-400 text-xs italic">
                      Start composing in the editor on the left to see your email layout preview here...
                    </div>
                  )}

                  {/* Footer */}
                  <div className="p-6 border-t border-[#E5E7EB] text-center text-xs text-slate-400 space-y-1 bg-[#FAFAF9]">
                    <p className="text-[11px] text-slate-500">
                      You are receiving this communication from AtTech Solutions Portfolio & Insights.
                    </p>
                    <p className="text-[10px] text-slate-400 underline">
                      Unsubscribe • Visit Website
                    </p>
                    <p className="text-[10px] text-slate-400">
                      © {new Date().getFullYear()} AtTech Solutions Inc. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Dispatch Bar */}
          <div className="p-5 bg-white border border-[#E5E7EB] rounded-4xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>
                Audience: <strong className="text-slate-800">{stats?.activeSubscribers || 0} active subscribers</strong> ({targetAudience.toUpperCase()})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Send Test Email Button */}
              <button
                type="button"
                onClick={() => setIsTestEmailModalOpen(true)}
                className="h-11 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Mail className="size-4 text-[#0B2E23]" />
                <span>Send Test Email</span>
              </button>

              {/* Broadcast Button */}
              <button
                type="button"
                onClick={() => setIsBroadcastConfirmModalOpen(true)}
                className="h-11 px-6 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Send className="size-4 text-[#AEFF48]" />
                <span>Broadcast to Subscribers</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CAMPAIGNS HISTORY & ARCHIVE                                        */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden w-full">
          <div className="p-5 border-b border-[#E5E7EB]/80 bg-[#FAFAF9]/40 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                placeholder="Search campaigns by title or subject..."
                className="w-full h-10 pl-10 pr-4 rounded-full border border-[#E5E7EB] text-xs focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={fetchCampaigns}
              className="h-10 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${isCampaignsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAF9]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Campaign Title & Subject</th>
                  <th className="py-4 px-4">Audience & Sender</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Delivered</th>
                  <th className="py-4 px-4">Dispatched At</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]/70">
                {isCampaignsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-6"><Skeleton className="h-4 w-44 rounded-md" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-32 rounded-md" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-20 rounded-md" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-24 rounded-md" /></td>
                      <td className="py-4 px-6 text-right"><Skeleton className="h-7 w-20 rounded-full ml-auto" /></td>
                    </tr>
                  ))
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <Mail className="size-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-700">No campaigns recorded yet</p>
                      <p className="text-xs text-slate-400 mt-1">Compose and broadcast your first promotional email in the Composer tab.</p>
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp._id} className="hover:bg-[#FAFAF9]/80 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-[#111111] text-xs">{camp.title}</p>
                        <p className="text-[11px] text-slate-500 font-semibold truncate max-w-xs mt-0.5">
                          {camp.subject}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {camp.targetAudience}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">{camp.senderName}</p>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                            camp.status === 'SENT'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : camp.status === 'SENDING'
                              ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-800 font-mono text-xs">
                          {camp.sentCount} / {camp.recipientCount}
                        </p>
                        {camp.failedCount > 0 && (
                          <p className="text-[10px] text-red-500">{camp.failedCount} failed</p>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-slate-500">
                        {camp.sentAt
                          ? new Date(camp.sentAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Draft'}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectCampaign(camp);
                            setIsInspectCampaignModalOpen(true);
                          }}
                          className="h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="size-3.5" />
                          <span>Preview</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SUBSCRIBERS DIRECTORY                                              */}
      {/* ========================================================================= */}
      {activeTab === 'subscribers' && (
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden w-full">
          <div className="p-5 border-b border-[#E5E7EB]/80 bg-[#FAFAF9]/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={subscriberSearch}
                onChange={(e) => setSubscriberSearch(e.target.value)}
                placeholder="Search subscribers by email, name, or source..."
                className="w-full h-10 pl-10 pr-4 rounded-full border border-[#E5E7EB] text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportSubscribers}
                className="h-10 px-4 rounded-full bg-white hover:bg-slate-50 border border-[#E5E7EB] text-slate-700 text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="size-3.5 text-[#0B2E23]" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddSubscriberModalOpen(true)}
                className="h-10 px-4 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="size-3.5 text-[#AEFF48]" />
                <span>Add Subscriber</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAF9]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Subscriber Email & Name</th>
                  <th className="py-4 px-4">Origin Source</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">IP Subnet</th>
                  <th className="py-4 px-4">Subscribed Date</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]/70">
                {isSubscribersLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-6"><Skeleton className="h-4 w-44 rounded-md" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-24 rounded-md" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-28 rounded-md" /></td>
                      <td className="py-4 px-6 text-right"><Skeleton className="h-7 w-12 rounded-full ml-auto" /></td>
                    </tr>
                  ))
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <Users className="size-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-700">No subscribers found</p>
                      <p className="text-xs text-slate-400 mt-1">Subscribers from your portfolio website will appear here automatically.</p>
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => (
                    <tr key={sub._id} className="hover:bg-[#FAFAF9]/80 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-[#111111] text-xs font-mono">{sub.email}</p>
                        {sub.name && <p className="text-[11px] text-slate-400">{sub.name}</p>}
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {sub.source}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            sub.status === 'SUBSCRIBED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-500 text-[11px]">
                        {sub.ipAddress || '127.0.0.***'}
                      </td>

                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        {new Date(sub.subscribedAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await newsletterApi.deleteSubscriber(sub._id);
                              showToast('Subscriber deleted');
                              fetchSubscribers();
                              fetchStats();
                            } catch (err: any) {
                              showToast(err.message || 'Failed to delete', 'error');
                            }
                          }}
                          className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Subscriber"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SEND TEST EMAIL                                                  */}
      {/* ========================================================================= */}
      {isTestEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <Mail className="size-4 text-[#0B2E23]" />
                <span>Send Live Test Email</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTestEmailModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Verify how your promotional email renders in a real Gmail/Outlook inbox with inlined styling and CDN images before broadcasting.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Recipient Email Address
              </label>
              <input
                type="email"
                required
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="admin@attech.io"
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] text-xs font-medium focus:outline-none focus:border-[#0B2E23]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsTestEmailModalOpen(false)}
                className="h-10 px-4 rounded-full border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSending}
                onClick={handleSendTestEmail}
                className="h-10 px-5 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                {isSending ? <Spinner size="sm" color="accent" /> : <Send className="size-3.5 text-[#AEFF48]" />}
                <span>Send Test Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BROADCAST CONFIRMATION                                           */}
      {/* ========================================================================= */}
      {isBroadcastConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800">
                <Send className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111111]">Broadcast Newsletter</h3>
                <p className="text-xs text-slate-400">Subject: {subject}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to broadcast this promotional email to{' '}
              <strong className="text-emerald-800">{stats?.activeSubscribers || 0} active subscribers</strong>.
              All emails will be dispatched using high-deliverability inlined HTML.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBroadcastConfirmModalOpen(false)}
                className="h-10 px-4 rounded-full border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSending}
                onClick={handleBroadcastCampaign}
                className="h-10 px-6 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                {isSending ? <Spinner size="sm" color="accent" /> : <Sparkles className="size-3.5 text-[#AEFF48]" />}
                <span>Confirm & Send Broadcast</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INSERT CLOUDINARY CDN IMAGE                                      */}
      {/* ========================================================================= */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-xl w-full p-6 space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <ImageIcon className="size-4 text-[#0B2E23]" />
                <span>Insert Gmail-Compatible CDN Image</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Quick Pick from CDN Assets */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Pick from Edge Cloudinary CDN Storage
              </label>
              {isLoadingCdn ? (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : cdnAssets.length === 0 ? (
                <p className="text-xs text-slate-400">No CDN media assets found. Enter URL below.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-[#E5E7EB]">
                  {cdnAssets.map((asset) => (
                    <button
                      key={asset.publicId}
                      type="button"
                      onClick={() => {
                        setImageUrl(asset.secureUrl);
                        setImageAlt(asset.publicId);
                      }}
                      className={`relative rounded-xl overflow-hidden border aspect-video group cursor-pointer transition-all ${
                        imageUrl === asset.secureUrl ? 'ring-2 ring-[#0B2E23] border-[#0B2E23]' : 'border-[#E5E7EB]'
                      }`}
                    >
                      <img src={asset.secureUrl} alt={asset.publicId} className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct URL Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Direct Image URL (HTTPS)
              </label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/.../image.jpg"
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] text-xs font-medium focus:outline-none focus:border-[#0B2E23]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Alt Text / Caption</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="e.g. New Workstation Dashboard"
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Display Width</label>
                <select
                  value={imageWidth}
                  onChange={(e) => setImageWidth(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium bg-white"
                >
                  <option value="100%">Full Width (100%)</option>
                  <option value="75%">Medium-Large (75%)</option>
                  <option value="50%">Half Width (50%)</option>
                  <option value="300px">Fixed 300px</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="h-10 px-4 rounded-full border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                className="h-10 px-5 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Insert into Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: INSERT HYPERLINK                                                 */}
      {/* ========================================================================= */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111]">Insert Hyperlink</h3>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target URL</label>
              <input
                type="url"
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://at-tech.tech"
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] text-xs font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Display Text (Optional)</label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="e.g. Visit our website"
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] text-xs font-medium focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="h-10 px-4 rounded-full border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="h-10 px-5 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold cursor-pointer"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADD MANUAL SUBSCRIBER                                            */}
      {/* ========================================================================= */}
      {isAddSubscriberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111]">Add Newsletter Subscriber</h3>
              <button
                type="button"
                onClick={() => setIsAddSubscriberModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubscriber} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newSubEmail}
                  onChange={(e) => setNewSubEmail(e.target.value)}
                  placeholder="subscriber@domain.com"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name (Optional)</label>
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Origin Source</label>
                <select
                  value={newSubSource}
                  onChange={(e) => setNewSubSource(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E7EB] text-xs font-medium bg-white"
                >
                  <option value="portfolio">Portfolio Website</option>
                  <option value="careers">Careers Portal</option>
                  <option value="manual">Manual Entry</option>
                  <option value="api">External API</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsAddSubscriberModalOpen(false)}
                  className="h-10 px-4 rounded-full border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold cursor-pointer"
                >
                  Add Subscriber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: INSPECT PAST CAMPAIGN & LIGHTBOX PREVIEW                         */}
      {/* ========================================================================= */}
      {isInspectCampaignModalOpen && inspectCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-bold text-[#111111]">{inspectCampaign.title}</h3>
                <p className="text-xs text-slate-400">{inspectCampaign.subject}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectCampaignModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Campaign Metadata Grid */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-[#E5E7EB]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <p className="font-bold text-emerald-800 mt-0.5">{inspectCampaign.status}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-[#E5E7EB]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Recipients</span>
                <p className="font-bold text-slate-800 mt-0.5">{inspectCampaign.sentCount} / {inspectCampaign.recipientCount}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-[#E5E7EB]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Dispatched Date</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {inspectCampaign.sentAt ? new Date(inspectCampaign.sentAt).toLocaleDateString() : 'Draft'}
                </p>
              </div>
            </div>

            {/* Inlined HTML Content Sandbox */}
            <div className="p-4 bg-slate-100 rounded-3xl border border-[#E5E7EB] max-h-96 overflow-y-auto">
              <div
                className="bg-white p-6 rounded-2xl border border-[#E5E7EB] text-slate-800 text-sm leading-relaxed email-preview-canvas"
                dangerouslySetInnerHTML={{ __html: inspectCampaign.htmlContent }}
              />
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsInspectCampaignModalOpen(false)}
                className="h-10 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
