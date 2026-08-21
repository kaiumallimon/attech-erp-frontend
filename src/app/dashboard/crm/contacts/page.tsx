'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  Globe,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { crmApi } from '../../../../lib/api';
import {
  CrmAccount,
  CrmContact,
} from '../../../../types/crm';
import CrmNavHeader from '../../../../components/crm/crm-nav-header';
import HeroSelect, { SelectOption } from '../../../../components/ui/hero-select';

export default function CrmContactsPage() {
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [contactsSearch, setContactsSearch] = useState('');
  const [contactsAccountFilter, setContactsAccountFilter] = useState('all');

  const [accounts, setAccounts] = useState<CrmAccount[]>([]);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CrmContact | null>(null);
  const [selectedContactDetail, setSelectedContactDetail] = useState<CrmContact | null>(null);

  const [contactForm, setContactForm] = useState<{
    accountId: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    email: string;
    phone: string;
    mobile: string;
    linkedinUrl: string;
    notes: string;
    isPrimary: boolean;
    status: string;
    tags: string[];
  }>({
    accountId: '',
    firstName: '',
    lastName: '',
    jobTitle: '',
    email: '',
    phone: '',
    mobile: '',
    linkedinUrl: '',
    notes: '',
    isPrimary: false,
    status: 'ACTIVE',
    tags: [],
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadContacts = async () => {
    setLoading(true);
    try {
      const [contactsRes, accRes] = await Promise.all([
        crmApi.contacts.list({
          search: contactsSearch,
          accountId: contactsAccountFilter,
        }),
        crmApi.accounts.list().catch(() => ({ data: [] })),
      ]);

      setContacts(Array.isArray(contactsRes) ? contactsRes : Array.isArray(contactsRes?.items) ? contactsRes.items : Array.isArray(contactsRes?.data) ? contactsRes.data : []);
      setAccounts(Array.isArray(accRes) ? accRes : Array.isArray(accRes?.items) ? accRes.items : Array.isArray(accRes?.data) ? accRes.data : []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load contacts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadContacts();
  }, [contactsAccountFilter]);

  const accountOptions: SelectOption[] = useMemo(() => {
    const list = Array.isArray(accounts) ? accounts : [];
    return [
      { key: '', value: '', label: 'Select Account' },
      ...list.map((a) => ({ key: a.id, value: a.id, label: a.name })),
    ];
  }, [accounts]);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await crmApi.contacts.update(editingContact.id, contactForm);
        showToast('Contact updated successfully.');
      } else {
        await crmApi.contacts.create(contactForm);
        showToast('Contact created successfully.');
      }
      setIsContactModalOpen(false);
      setEditingContact(null);
      void loadContacts();
    } catch (err: any) {
      showToast(err.message || 'Failed to save contact', 'error');
    }
  };

  const handleOpenContactProfile = async (contactId: string) => {
    try {
      const full = await crmApi.contacts.get(contactId);
      setSelectedContactDetail(full);
    } catch (err: any) {
      showToast(err.message || 'Failed to load contact details', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold transition-all duration-300 animate-fadeIn ${
            toastMessage.type === 'success'
              ? 'bg-[#0B2E23] text-[#AEFF48] border-[#AEFF48]/30'
              : 'bg-rose-950 text-rose-200 border-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Compact ERP Header */}
      <CrmNavHeader
        title="Contacts"
        subtitle="Individual stakeholder contacts, key decision makers, and communications touchpoints."
        breadcrumb={[
          { label: 'CRM & Sales', href: '/dashboard/crm' },
        ]}
        onRefresh={() => void loadContacts()}
        isRefreshing={loading}
        actionButton={
          <button
            type="button"
            onClick={() => {
              setEditingContact(null);
              setContactForm({
                accountId: accounts[0]?.id || '',
                firstName: '',
                lastName: '',
                jobTitle: '',
                email: '',
                phone: '',
                mobile: '',
                linkedinUrl: '',
                notes: '',
                isPrimary: false,
                status: 'ACTIVE',
                tags: [],
              });
              setIsContactModalOpen(true);
            }}
            className="h-9 px-4 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-xs hover:bg-[#0B251A] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Add Contact</span>
          </button>
        }
      />

      {/* Search & Filter */}
      <div className="p-3.5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts by name, email, job title..."
              value={contactsSearch}
              onChange={(e) => setContactsSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void loadContacts()}
              className="w-full h-9 pl-9 pr-3 rounded-full border border-[#E5E7EB] text-xs text-slate-800 focus:outline-none focus:border-[#0B2E23]"
            />
          </div>

          <select
            value={contactsAccountFilter}
            onChange={(e) => setContactsAccountFilter(e.target.value)}
            className="h-9 px-3 rounded-full border border-[#E5E7EB] text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => void loadContacts()}
          className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-700 font-bold text-xs hover:bg-[#FAF7F2] transition-colors cursor-pointer"
        >
          Filter
        </button>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.length === 0 ? (
          <div className="col-span-full text-center py-16 text-xs text-slate-400 bg-white rounded-4xl border border-[#E5E7EB]">
            No contacts found. Click &quot;Add Contact&quot; to register a client stakeholder.
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-3 flex flex-col justify-between hover:border-[#0B2E23]/30 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {contact.firstName} {contact.lastName}
                      </h4>
                      {contact.isPrimary && (
                        <span className="text-[8.5px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 flex items-center gap-0.5">
                          <Star className="size-2.5 fill-amber-600 text-amber-600" />
                          <span>Primary</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{contact.jobTitle || 'Stakeholder'}</p>
                  </div>

                  <span className="text-[10px] font-bold text-slate-400">
                    {(contact.accountId as any)?.name || 'Direct'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="size-3.5 text-slate-400 shrink-0" />
                      <a href={`mailto:${contact.email}`} className="text-emerald-800 hover:underline truncate">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-3.5 text-slate-400 shrink-0" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => void handleOpenContactProfile(contact.id)}
                  className="px-3 py-1 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-[10px] hover:bg-[#0B251A] cursor-pointer transition-colors"
                >
                  View Profile
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingContact(contact);
                      setContactForm({
                        accountId: (contact.accountId as any)?.id || (contact.accountId as any)?._id || (contact.accountId as string),
                        firstName: contact.firstName,
                        lastName: contact.lastName,
                        jobTitle: contact.jobTitle || '',
                        email: contact.email || '',
                        phone: contact.phone || '',
                        mobile: contact.mobile || '',
                        linkedinUrl: contact.linkedinUrl || '',
                        notes: contact.notes || '',
                        isPrimary: contact.isPrimary,
                        status: contact.status,
                        tags: contact.tags || [],
                      });
                      setIsContactModalOpen(true);
                    }}
                    className="size-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 inline-flex items-center justify-center cursor-pointer transition-colors"
                    title="Edit Contact"
                  >
                    <Edit2 className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Delete contact ${contact.firstName} ${contact.lastName}?`)) {
                        await crmApi.contacts.delete(contact.id);
                        showToast('Contact deleted.');
                        void loadContacts();
                      }
                    }}
                    className="size-7 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 inline-flex items-center justify-center cursor-pointer transition-colors"
                    title="Delete Contact"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add/Edit Contact */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-md rounded-4xl bg-white shadow-2xl border border-[#E5E7EB] overflow-hidden my-8">
            <div className="p-5 bg-[#0B2E23] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black">{editingContact ? 'Edit Contact' : 'New Contact'}</h3>
                <p className="text-[11px] text-white/70">Associate stakeholder with account</p>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="size-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Account *</label>
                <HeroSelect
                  value={contactForm.accountId}
                  options={accountOptions}
                  onChange={(val) => setContactForm((prev) => ({ ...prev, accountId: val }))}
                  className="w-full h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.firstName}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. VP of Product"
                  value={contactForm.jobTitle}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, jobTitle: e.target.value }))}
                  className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">LinkedIn / Social Profile</label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/..."
                  value={contactForm.linkedinUrl}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
                  className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={contactForm.isPrimary}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, isPrimary: e.target.checked }))}
                  className="size-4 rounded accent-[#0B2E23]"
                />
                <label htmlFor="isPrimary" className="font-bold text-slate-700 cursor-pointer">
                  Designate as Primary Stakeholder Contact
                </label>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold hover:bg-[#0B251A] cursor-pointer shadow-xs"
                >
                  {editingContact ? 'Save Changes' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Detailed Contact Profile */}
      {selectedContactDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-end animate-fadeIn">
          <div className="w-full max-w-lg h-full bg-white shadow-2xl border-l border-[#E5E7EB] overflow-y-auto p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">
                      {selectedContactDetail.firstName} {selectedContactDetail.lastName}
                    </h3>
                    {selectedContactDetail.isPrimary && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {selectedContactDetail.jobTitle || 'Stakeholder'} • {(selectedContactDetail.accountId as any)?.name || 'Direct Contact'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedContactDetail(null)}
                  className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Direct Touchpoints Info */}
              <div className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-2.5 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Information</span>
                {selectedContactDetail.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-slate-400 shrink-0" />
                    <a href={`mailto:${selectedContactDetail.email}`} className="text-emerald-800 font-bold hover:underline">
                      {selectedContactDetail.email}
                    </a>
                  </div>
                )}
                {selectedContactDetail.phone && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="size-3.5 text-slate-400 shrink-0" />
                    <span>{selectedContactDetail.phone}</span>
                  </div>
                )}
                {selectedContactDetail.linkedinUrl && (
                  <div className="flex items-center gap-2">
                    <Globe className="size-3.5 text-slate-400 shrink-0" />
                    <a href={selectedContactDetail.linkedinUrl} target="_blank" rel="noreferrer" className="text-sky-700 font-bold hover:underline">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>

              {/* Related Deals */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Related Deals ({selectedContactDetail.deals?.length || 0})
                </h4>
                {selectedContactDetail.deals?.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No deals directly associated.</p>
                ) : (
                  selectedContactDetail.deals?.map((d) => (
                    <div key={d.id} className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{d.name}</p>
                        <p className="text-[10px] text-slate-500">${d.value.toLocaleString()} USD</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-white border border-[#ECE5DA]">
                        {d.status === 'WON' ? 'Closed Won' : d.status}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Activities & Communication History */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Communication History & Activities ({selectedContactDetail.activities?.length || 0})
                </h4>
                {selectedContactDetail.activities?.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No activities recorded for this contact.</p>
                ) : (
                  selectedContactDetail.activities?.map((act) => (
                    <div key={act.id} className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-sm bg-slate-200 text-slate-700">
                          {act.type}
                        </span>
                        <span className="text-[10px] text-slate-400">{new Date(act.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="font-bold text-slate-800">{act.subject}</p>
                      {act.description && <p className="text-[11px] text-slate-500">{act.description}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setSelectedContactDetail(null)}
                className="w-full h-10 rounded-full bg-[#0B2E23] text-white font-bold text-xs hover:bg-[#0B251A] cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
