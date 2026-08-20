'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Mail,
  Phone,
  Plus,
  Search,
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
      { key: '', value: '', label: 'Select Client Account' },
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

      <CrmNavHeader
        title="Stakeholder Contacts"
        subtitle="Maintain key decision makers, client executives, and direct communications touchpoints."
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
            className="h-10 px-5 rounded-full bg-[#AEFF48] text-[#0B2E23] font-bold text-xs hover:bg-[#9DE83E] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="size-4" />
            <span>New Contact</span>
          </button>
        }
      />

      {/* Search & Filter */}
      <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts by name, email, job title..."
              value={contactsSearch}
              onChange={(e) => setContactsSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void loadContacts()}
              className="w-full h-10 pl-10 pr-4 rounded-full border border-[#E5E7EB] text-xs text-slate-800 focus:outline-none focus:border-[#0B2E23]"
            />
          </div>

          <select
            value={contactsAccountFilter}
            onChange={(e) => setContactsAccountFilter(e.target.value)}
            className="h-10 px-4 rounded-full border border-[#E5E7EB] text-xs font-semibold text-slate-700 bg-white"
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
          className="h-10 px-4 rounded-full border border-[#E5E7EB] text-slate-700 font-bold text-xs hover:bg-[#FAF7F2] transition-colors cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.length === 0 ? (
          <div className="col-span-full text-center py-16 text-xs text-slate-400 bg-white rounded-4xl border border-[#E5E7EB]">
            No contacts found. Click &quot;New Contact&quot; to register stakeholders.
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {contact.firstName} {contact.lastName}
                    </h4>
                    {contact.isPrimary && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{contact.jobTitle || 'Stakeholder'}</p>
                </div>

                <span className="text-[10px] font-bold text-slate-400">
                  {(contact.accountId as any)?.name || 'Direct'}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
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

              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-end gap-1.5">
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
          ))
        )}
      </div>

      {/* Modal: Add/Edit Contact */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-md rounded-4xl bg-white shadow-2xl border border-[#E5E7EB] overflow-hidden my-8">
            <div className="p-6 bg-[#0B2E23] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">{editingContact ? 'Edit Contact' : 'New Client Contact'}</h3>
                <p className="text-xs text-white/70">Associate stakeholder with client account</p>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Account *</label>
                <HeroSelect
                  value={contactForm.accountId}
                  options={accountOptions}
                  onChange={(val) => setContactForm((prev) => ({ ...prev, accountId: val }))}
                  className="w-full h-10 text-xs"
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
                    className="w-full h-10 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. VP of Technology"
                  value={contactForm.jobTitle}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, jobTitle: e.target.value }))}
                  className="w-full h-10 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
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

              <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="h-10 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold hover:bg-[#0B251A] cursor-pointer shadow-xs"
                >
                  {editingContact ? 'Save Changes' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
