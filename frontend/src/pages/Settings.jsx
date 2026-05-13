import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HiBell,
  HiClock,
  HiCog,
  HiHeart,
  HiLockClosed,
  HiMail,
  HiOfficeBuilding,
  HiPhone,
  HiShieldCheck,
  HiUser,
} from "react-icons/hi";
import Loader from "../components/common/Loader";

const API_BASE = "http://localhost:5000/api/admin/settings";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100";

const sectionClass =
  "rounded-lg border border-slate-200 bg-white p-6 shadow-sm";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingClinic, setSavingClinic] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "management",
    notes: "",
  });

  const [clinic, setClinic] = useState({
    name: "CliniX Clinic",
    address: "",
    phone: "",
    email: "",
    website: "",
    hours: "Mon-Fri 9:00-18:00",
    timezone: "Africa/Lagos",
    appointmentDuration: 30,
  });

  const [preferences, setPreferences] = useState({
    notifications: true,
    emailNotifications: true,
    appointmentReminders: true,
    doctorApprovalAlerts: true,
    prescriptionAlerts: true,
    compactTables: false,
    defaultDashboardRange: "7d",
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, clinicRes, preferencesRes] = await Promise.all([
        axios.get(`${API_BASE}/profile`, authHeaders()),
        axios.get(`${API_BASE}/clinic`, authHeaders()),
        axios.get(`${API_BASE}/preferences`, authHeaders()),
      ]);

      setProfile((prev) => ({ ...prev, ...profileRes.data.user }));
      setClinic((prev) => ({ ...prev, ...clinicRes.data.clinic }));
      setPreferences((prev) => ({
        ...prev,
        ...preferencesRes.data.preferences,
      }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleProfileChange = (event) => {
    setProfile((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleClinicChange = (event) => {
    const { name, value } = event.target;
    setClinic((prev) => ({
      ...prev,
      [name]: name === "appointmentDuration" ? Number(value) : value,
    }));
  };

  const handlePasswordChange = (event) => {
    setPassword((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const updatePreference = (name, value) => {
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async () => {
    if (!profile.firstName || !profile.lastName || !profile.email || !profile.phone) {
      toast.error("Please fill all required profile fields");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await axios.put(`${API_BASE}/profile`, profile, authHeaders());
      setProfile((prev) => ({ ...prev, ...res.data.user }));

      const existingUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...existingUser,
          ...res.data.user,
          name: res.data.user.fullName,
        }),
      );

      window.dispatchEvent(new Event("storage"));
      toast.success("Profile updated");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveClinic = async () => {
    if (!clinic.name || !clinic.phone || !clinic.hours) {
      toast.error("Clinic name, phone, and hours are required");
      return;
    }

    setSavingClinic(true);
    try {
      const res = await axios.put(`${API_BASE}/clinic`, clinic, authHeaders());
      setClinic((prev) => ({ ...prev, ...res.data.clinic }));
      toast.success("Clinic settings saved");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update clinic");
    } finally {
      setSavingClinic(false);
    }
  };

  const savePreferences = async () => {
    setSavingPreferences(true);
    try {
      const res = await axios.put(
        `${API_BASE}/preferences`,
        preferences,
        authHeaders(),
      );
      setPreferences((prev) => ({ ...prev, ...res.data.preferences }));
      localStorage.setItem("clinixPreferences", JSON.stringify(res.data.preferences));
      toast.success("Preferences saved");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update preferences");
    } finally {
      setSavingPreferences(false);
    }
  };

  const resetPreferences = () => {
    setPreferences({
      notifications: true,
      emailNotifications: true,
      appointmentReminders: true,
      doctorApprovalAlerts: true,
      prescriptionAlerts: true,
      compactTables: false,
      defaultDashboardRange: "7d",
    });
  };

  const savePassword = async () => {
    if (!password.currentPassword || !password.newPassword || !password.confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (password.newPassword !== password.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (password.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSavingPassword(true);
    try {
      await axios.put(
        `${API_BASE}/password`,
        {
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
        },
        authHeaders(),
      );
      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password updated");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const Toggle = ({ checked, label, description, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-teal-200 hover:bg-teal-50/50"
    >
      <span>
        <span className="block text-sm font-semibold text-slate-900">
          {label}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-teal-700" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );

  if (loading) return <Loader />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-700 via-emerald-600 to-sky-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage account access, clinic identity, notifications, and workspace behavior.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Reload Settings
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className={sectionClass}>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <HiUser className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Profile Information
                </h2>
                <p className="text-sm text-slate-500">
                  This information powers the navbar and admin identity.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  First Name
                </span>
                <input
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleProfileChange}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Last Name
                </span>
                <input
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleProfileChange}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Email
                </span>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Phone
                </span>
                <input
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Department
                </span>
                <select
                  name="department"
                  value={profile.department}
                  onChange={handleProfileChange}
                  className={inputClass}
                >
                  <option value="management">Management</option>
                  <option value="support">Support</option>
                  <option value="technical">Technical</option>
                  <option value="medical">Medical</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Admin Notes
                </span>
                <textarea
                  name="notes"
                  rows={3}
                  value={profile.notes || ""}
                  onChange={handleProfileChange}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </section>

          <section className={sectionClass}>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <HiOfficeBuilding className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Clinic Details
                </h2>
                <p className="text-sm text-slate-500">
                  Persisted clinic information for operational views and future patient-facing surfaces.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Clinic Name
                </span>
                <input
                  name="name"
                  value={clinic.name}
                  onChange={handleClinicChange}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Clinic Phone
                </span>
                <input
                  name="phone"
                  value={clinic.phone}
                  onChange={handleClinicChange}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Clinic Email
                </span>
                <input
                  type="email"
                  name="email"
                  value={clinic.email}
                  onChange={handleClinicChange}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Website
                </span>
                <input
                  name="website"
                  value={clinic.website}
                  onChange={handleClinicChange}
                  className={inputClass}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Address
                </span>
                <input
                  name="address"
                  value={clinic.address}
                  onChange={handleClinicChange}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Opening Hours
                </span>
                <input
                  name="hours"
                  value={clinic.hours}
                  onChange={handleClinicChange}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Timezone
                </span>
                <select
                  name="timezone"
                  value={clinic.timezone}
                  onChange={handleClinicChange}
                  className={inputClass}
                >
                  <option value="Africa/Lagos">Africa/Lagos</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Default Appointment Duration
                </span>
                <input
                  type="number"
                  min="10"
                  max="240"
                  name="appointmentDuration"
                  value={clinic.appointmentDuration}
                  onChange={handleClinicChange}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={saveClinic}
                disabled={savingClinic}
                className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingClinic ? "Saving..." : "Save Clinic"}
              </button>
            </div>
          </section>

          <section className={sectionClass}>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                <HiLockClosed className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Change Password
                </h2>
                <p className="text-sm text-slate-500">
                  Updates your login password immediately.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Current Password
                </span>
                <input
                  type="password"
                  name="currentPassword"
                  value={password.currentPassword}
                  onChange={handlePasswordChange}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  New Password
                </span>
                <input
                  type="password"
                  name="newPassword"
                  value={password.newPassword}
                  onChange={handlePasswordChange}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Confirm New Password
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={password.confirmPassword}
                  onChange={handlePasswordChange}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={savePassword}
                disabled={savingPassword}
                className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className={sectionClass}>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <HiCog className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Preferences
                </h2>
                <p className="text-sm text-slate-500">
                  Saved for this admin account.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Toggle
                checked={preferences.notifications}
                label="In-app notifications"
                description="Receive notifications in the admin navbar."
                onChange={(value) => updatePreference("notifications", value)}
              />
              <Toggle
                checked={preferences.emailNotifications}
                label="Email notifications"
                description="Keep email alerts enabled for critical events."
                onChange={(value) =>
                  updatePreference("emailNotifications", value)
                }
              />
              <Toggle
                checked={preferences.appointmentReminders}
                label="Appointment reminders"
                description="Surface reminders for upcoming visits."
                onChange={(value) =>
                  updatePreference("appointmentReminders", value)
                }
              />
              <Toggle
                checked={preferences.doctorApprovalAlerts}
                label="Doctor approval alerts"
                description="Notify admins when doctors request access."
                onChange={(value) =>
                  updatePreference("doctorApprovalAlerts", value)
                }
              />
              <Toggle
                checked={preferences.prescriptionAlerts}
                label="Prescription alerts"
                description="Notify admins about prescription changes."
                onChange={(value) =>
                  updatePreference("prescriptionAlerts", value)
                }
              />
              <Toggle
                checked={preferences.compactTables}
                label="Compact tables"
                description="Prefer denser table rows where supported."
                onChange={(value) => updatePreference("compactTables", value)}
              />

              <label className="block rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="mb-2 block text-sm font-semibold text-slate-900">
                  Dashboard range
                </span>
                <select
                  value={preferences.defaultDashboardRange}
                  onChange={(event) =>
                    updatePreference("defaultDashboardRange", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={savePreferences}
                disabled={savingPreferences}
                className="flex-1 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPreferences ? "Saving..." : "Save Preferences"}
              </button>
              <button
                onClick={resetPreferences}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-4 text-lg font-bold text-slate-950">
              Clinic Preview
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <HiHeart className="mt-0.5 h-5 w-5 text-teal-700" />
                <div>
                  <p className="font-bold text-slate-950">{clinic.name}</p>
                  <p className="text-slate-500">{clinic.address || "No address set"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <HiPhone className="mt-0.5 h-5 w-5 text-teal-700" />
                <p className="text-slate-600">{clinic.phone || "No phone set"}</p>
              </div>
              <div className="flex gap-3">
                <HiMail className="mt-0.5 h-5 w-5 text-teal-700" />
                <p className="text-slate-600">{clinic.email || "No email set"}</p>
              </div>
              <div className="flex gap-3">
                <HiClock className="mt-0.5 h-5 w-5 text-teal-700" />
                <p className="text-slate-600">{clinic.hours}</p>
              </div>
              <div className="flex gap-3">
                <HiShieldCheck className="mt-0.5 h-5 w-5 text-teal-700" />
                <p className="text-slate-600">
                  {clinic.appointmentDuration} minute default appointments
                </p>
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <HiBell className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Active Alert Channels
                </h2>
                <p className="text-sm text-slate-500">
                  {
                    [
                      preferences.notifications && "In-app",
                      preferences.emailNotifications && "Email",
                      preferences.appointmentReminders && "Reminders",
                    ].filter(Boolean).length
                  }{" "}
                  enabled
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Settings;
