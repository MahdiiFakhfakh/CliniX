import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Loader from "../components/common/Loader";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/admin/settings/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setUser(res.data.user);
        setProfile({
          firstName: res.data.user.firstName,
          lastName: res.data.user.lastName,
          email: res.data.user.email,
          phone: res.data.user.phone || "",
        });
        setLoading(false);
      } catch (err) {
        toast.error("Failed to load profile");
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleProfileSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "http://localhost:5000/api/admin/settings/profile",
        profile,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(res.data.message);
      setUser(res.data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handlePasswordChange = (e) => {
    setPassword({ ...password, [e.target.name]: e.target.value });
  };

  const handlePasswordSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "http://localhost:5000/api/admin/settings/password",
        password,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(res.data.message);
      setPassword({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Profile Card */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={profile.firstName}
            onChange={handleProfileChange}
            className="input-field"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={profile.lastName}
            onChange={handleProfileChange}
            className="input-field"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={profile.email}
            onChange={handleProfileChange}
            className="input-field"
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={profile.phone}
            onChange={handleProfileChange}
            className="input-field"
          />
        </div>
        <button onClick={handleProfileSave} className="btn-primary mt-2">
          Save Profile
        </button>
      </div>

      {/* Password Card */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold">Change Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="password"
            name="currentPassword"
            placeholder="Current Password"
            value={password.currentPassword}
            onChange={handlePasswordChange}
            className="input-field"
          />
          <input
            type="password"
            name="newPassword"
            placeholder="New Password"
            value={password.newPassword}
            onChange={handlePasswordChange}
            className="input-field"
          />
        </div>
        <button onClick={handlePasswordSave} className="btn-primary mt-2">
          Update Password
        </button>
      </div>

      {/* Theme Toggle (Optional) */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold">Theme</h3>
        <div className="flex items-center space-x-4">
          <button
            className="btn-secondary"
            onClick={() => document.documentElement.classList.remove("dark")}
          >
            Light
          </button>
          <button
            className="btn-secondary"
            onClick={() => document.documentElement.classList.add("dark")}
          >
            Dark
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
