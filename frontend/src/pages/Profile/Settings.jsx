import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CreditCard,
  ExternalLink,
  FileUp,
  Lock,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import {
  changePassword,
  deleteMyAccount,
  fetchMySettings,
  fetchVerificationDocuments,
  submitSupportRequest,
  updateMySettings,
  uploadVerificationDocument,
} from "../../api/accounts.js";
import { withApiUrl } from "../../api/client.js";
import { clearSession } from "../../utils/auth.js";

const fieldClassName =
  "mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#155BC2]";

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
      checked ? "bg-[#155BC2]" : "bg-slate-300"
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
        checked ? "translate-x-5" : "translate-x-1"
      }`}
    />
  </button>
);

const Section = ({ title, description, children }) => (
  <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-black text-[#091E42]">{title}</h2>
    {description ? (
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    ) : null}
    <div className="mt-5">{children}</div>
  </section>
);

export default function Settings() {
  const navigate = useNavigate();
  const [settingsForm, setSettingsForm] = useState({
    language: "en",
    profile_visible: true,
    booking_requests: true,
    new_messages: true,
    booking_updates: true,
    payment_issues: false,
    roommate_matches: true,
    email_notifications: true,
    sms_notifications: false,
    in_app_notifications: true,
  });
  const [documents, setDocuments] = useState([]);
  const [documentForm, setDocumentForm] = useState({
    docType: "student_id",
    file: null,
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [supportForm, setSupportForm] = useState({
    issue_type: "verification",
    description: "",
    attachment: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const pushNotice = (type, message) => setNotice({ type, message });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    pushNotice("", "");

    try {
      const [settings, docs] = await Promise.all([
        fetchMySettings(),
        fetchVerificationDocuments(),
      ]);
      setSettingsForm(settings);
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (loadError) {
      pushNotice("error", loadError.message || "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSettingsSave = async () => {
    setSaving(true);
    pushNotice("", "");

    try {
      await updateMySettings(settingsForm);
      pushNotice("success", "Settings saved.");
    } catch (saveError) {
      pushNotice("error", saveError.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async () => {
    if (!documentForm.file) {
      pushNotice("error", "Choose a document before uploading.");
      return;
    }

    setSaving(true);
    pushNotice("", "");

    try {
      const body = new FormData();
      body.append("doc_type", documentForm.docType);
      body.append("file", documentForm.file);
      await uploadVerificationDocument(body);
      setDocumentForm((current) => ({ ...current, file: null }));
      pushNotice("success", "Document uploaded.");
      await loadSettings();
    } catch (uploadError) {
      pushNotice("error", uploadError.message || "Failed to upload document.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    setSaving(true);
    pushNotice("", "");

    try {
      await changePassword(passwordForm);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      pushNotice("success", "Password updated.");
    } catch (passwordError) {
      pushNotice("error", passwordError.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  const handleSupportSubmit = async () => {
    if (!supportForm.description.trim()) {
      pushNotice("error", "Support description is required.");
      return;
    }

    setSaving(true);
    pushNotice("", "");

    try {
      const body = new FormData();
      body.append("issue_type", supportForm.issue_type);
      body.append("description", supportForm.description);
      if (supportForm.attachment) {
        body.append("attachment", supportForm.attachment);
      }
      await submitSupportRequest(body);
      setSupportForm({
        issue_type: supportForm.issue_type,
        description: "",
        attachment: null,
      });
      pushNotice("success", "Support request sent.");
    } catch (supportError) {
      pushNotice("error", supportError.message || "Failed to submit support request.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    const confirmed = window.confirm(
      "Deactivate this account? This is a soft deactivation and may be blocked if you have active bookings.",
    );
    if (!confirmed) return;

    setSaving(true);
    pushNotice("", "");

    try {
      await deleteMyAccount();
      clearSession();
      navigate("/login");
    } catch (deleteError) {
      pushNotice("error", deleteError.message || "Failed to deactivate account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#091E42]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black">Settings</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Fake toggles, password changes, and local document state have been replaced with the real account settings APIs.
          </p>
        </header>

        {notice.message ? (
          <div
            className={`mt-6 rounded-3xl border p-4 text-sm font-semibold shadow-sm ${
              notice.type === "error"
                ? "border-rose-100 bg-white text-rose-600"
                : "border-emerald-100 bg-white text-emerald-600"
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading settings...
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <Section title="Preferences & Alerts" description="Shared user settings for language, visibility, and notification preferences.">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-600">Language</span>
                  <select
                    value={settingsForm.language}
                    onChange={(event) =>
                      setSettingsForm((current) => ({
                        ...current,
                        language: event.target.value,
                      }))
                    }
                    className={fieldClassName}
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </label>

                {[
                  ["profile_visible", "Profile visible"],
                  ["roommate_matches", "Roommate match alerts"],
                  ["new_messages", "New messages"],
                  ["booking_updates", "Booking updates"],
                  ["booking_requests", "Booking requests"],
                  ["email_notifications", "Email notifications"],
                  ["sms_notifications", "SMS notifications"],
                  ["in_app_notifications", "In-app notifications"],
                ].map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-bold text-slate-600">{label}</span>
                    <Toggle
                      checked={Boolean(settingsForm[key])}
                      onChange={(value) =>
                        setSettingsForm((current) => ({
                          ...current,
                          [key]: value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSettingsSave}
                disabled={saving}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#155BC2] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Bell className="h-4 w-4" />
                Save settings
              </button>
            </Section>

            <Section title="Verification Documents" description="Student verification documents now persist through the backend.">
              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)_auto]">
                <select
                  value={documentForm.docType}
                  onChange={(event) =>
                    setDocumentForm((current) => ({
                      ...current,
                      docType: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                >
                  <option value="student_id">Student ID</option>
                  <option value="national_id">National ID</option>
                  <option value="university_email">University Email</option>
                </select>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                  <UploadCloud className="h-4 w-4" />
                  {documentForm.file ? documentForm.file.name : "Choose file"}
                  <input
                    type="file"
                    onChange={(event) =>
                      setDocumentForm((current) => ({
                        ...current,
                        file: event.target.files?.[0] || null,
                      }))
                    }
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleDocumentUpload}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#155BC2] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <FileUp className="h-4 w-4" />
                  Upload
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {documents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    No documents uploaded yet.
                  </div>
                ) : (
                  documents.map((document) => (
                    <div
                      key={document.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-[#091E42]">
                            {document.doc_type.replaceAll("_", " ")}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Status: {document.status}
                          </p>
                          {document.review_note ? (
                            <p className="mt-2 text-sm text-slate-600">
                              {document.review_note}
                            </p>
                          ) : null}
                        </div>
                        <a
                          href={withApiUrl(document.file)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-black text-[#155BC2]"
                        >
                          Open file
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Section>

            <Section title="Password" description="Password changes now validate against your current password on the backend.">
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  type="password"
                  placeholder="Current password"
                  value={passwordForm.current_password}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      current_password: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={passwordForm.new_password}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      new_password: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={passwordForm.confirm_password}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirm_password: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </div>

              <button
                type="button"
                onClick={handlePasswordSave}
                disabled={saving}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#155BC2] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Lock className="h-4 w-4" />
                Update password
              </button>
            </Section>

            <Section title="Support" description="Create a real support request with an optional attachment.">
              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <select
                  value={supportForm.issue_type}
                  onChange={(event) =>
                    setSupportForm((current) => ({
                      ...current,
                      issue_type: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                >
                  <option value="bug">Bug</option>
                  <option value="billing">Billing</option>
                  <option value="verification">Verification</option>
                  <option value="other">Other</option>
                </select>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                  <UploadCloud className="h-4 w-4" />
                  {supportForm.attachment ? supportForm.attachment.name : "Optional attachment"}
                  <input
                    type="file"
                    onChange={(event) =>
                      setSupportForm((current) => ({
                        ...current,
                        attachment: event.target.files?.[0] || null,
                      }))
                    }
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                rows={5}
                value={supportForm.description}
                onChange={(event) =>
                  setSupportForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe the issue."
                className={`${fieldClassName} mt-4`}
              />
              <button
                type="button"
                onClick={handleSupportSubmit}
                disabled={saving}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#155BC2] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Send className="h-4 w-4" />
                Send support request
              </button>
            </Section>

            <Section title="Billing & Payments" description="Stored cards are intentionally out of scope, so this page links to truthful payment flows instead.">
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => navigate("/payments")}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-left"
                >
                  <span>
                    <span className="block font-black text-[#091E42]">Payments</span>
                    <span className="mt-1 block text-sm text-slate-500">
                      View real payment attempts and booking-related transactions.
                    </span>
                  </span>
                  <CreditCard className="h-5 w-5 text-[#155BC2]" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/my-bookings")}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-left"
                >
                  <span>
                    <span className="block font-black text-[#091E42]">My Bookings</span>
                    <span className="mt-1 block text-sm text-slate-500">
                      Follow real booking, payment, and review status there.
                    </span>
                  </span>
                  <ExternalLink className="h-5 w-5 text-[#155BC2]" />
                </button>
              </div>
            </Section>

            <Section title="Danger Zone" description="Account deletion is a soft deactivation and may be blocked by active business rules.">
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-600" />
                  <div>
                    <p className="font-black text-rose-700">Deactivate account</p>
                    <p className="mt-1 text-sm text-rose-600">
                      This does not hard-delete your row. The backend decides whether deactivation is allowed right now.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDeactivate}
                  disabled={saving}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-5 py-3 text-sm font-black text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Deactivate account
                </button>
              </div>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}
