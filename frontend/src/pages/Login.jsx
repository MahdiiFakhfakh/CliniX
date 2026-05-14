import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiBadgeCheck,
  HiCalendar,
  HiChartBar,
  HiEye,
  HiEyeOff,
  HiHeart,
  HiLockClosed,
  HiMail,
  HiShieldCheck,
  HiSparkles,
  HiUserGroup,
} from "react-icons/hi";
import { authAPI } from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authAPI.login({ email, password });

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          fullName: user.fullName || user.profile?.fullName || user.name,
          phone: user.phone || user.profile?.phone,
          department: user.department || user.profile?.department,
        }),
      );

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      const message = err.response?.data?.error || "Invalid email or password";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const careMetrics = [
    {
      label: "Patients",
      value: "50",
      icon: <HiUserGroup className="h-5 w-5" />,
      tone: "bg-teal-50 text-teal-700",
    },
    {
      label: "Visits",
      value: "181",
      icon: <HiCalendar className="h-5 w-5" />,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Care score",
      value: "98%",
      icon: <HiBadgeCheck className="h-5 w-5" />,
      tone: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5fbfa] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden border-r border-teal-100/80 bg-[linear-gradient(135deg,#effdf9_0%,#eef8ff_48%,#fbfffd_100%)] px-10 py-10 lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,118,110,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,118,110,0.08)_1px,transparent_1px)] bg-[size:42px_42px] opacity-60" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-700 text-white shadow-lg shadow-teal-900/20">
                <HiHeart className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xl font-black tracking-tight">CliniX</p>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
                  Care Console
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm">
              <HiShieldCheck className="h-5 w-5" />
              Secure access
            </div>
          </div>

          <div className="relative z-10 flex flex-1 items-center">
            <div className="w-full max-w-3xl">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-teal-100">
                <HiSparkles className="h-5 w-5 text-amber-500" />
                Smart clinic administration
              </div>

              <h1 className="max-w-2xl text-5xl font-black tracking-tight text-slate-950 xl:text-6xl">
                A calmer command center for modern care teams.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                Monitor patients, appointments, physicians, prescriptions, and
                operational insights from one secure workspace.
              </p>

              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
                {careMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-lg border border-white/80 bg-white/80 p-4 shadow-lg shadow-teal-900/5 backdrop-blur"
                  >
                    <div
                      className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${metric.tone}`}
                    >
                      {metric.icon}
                    </div>
                    <p className="text-2xl font-black text-slate-950">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-10 max-w-2xl rounded-lg border border-teal-100 bg-white/85 p-5 shadow-2xl shadow-teal-900/10 backdrop-blur">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
                      Live overview
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Today&apos;s clinical activity
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                    <HiChartBar className="h-5 w-5" />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-end gap-5">
                  <div className="space-y-3">
                    {[
                      ["Appointments", "92%"],
                      ["Prescriptions", "68%"],
                      ["Doctor availability", "81%"],
                    ].map(([label, width], index) => (
                      <div key={label}>
                        <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">
                          <span>{label}</span>
                          <span>{width}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full ${
                              index === 0
                                ? "bg-teal-600"
                                : index === 1
                                  ? "bg-sky-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{ width }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-slate-950 px-5 py-4 text-white">
                    <p className="text-3xl font-black">24</p>
                    <p className="text-xs font-semibold text-teal-100">
                      active clinicians
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-sm font-medium text-slate-500">
            <span>HIPAA-minded workflow</span>
            <span>Audit-ready access</span>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-700 text-white shadow-lg shadow-teal-900/20">
                <HiHeart className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xl font-black tracking-tight">CliniX</p>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
                  Care Console
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-teal-100 bg-white/95 p-6 shadow-2xl shadow-teal-900/10 backdrop-blur sm:p-8">
              <div className="mb-8">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-teal-800">
                  <HiShieldCheck className="h-4 w-4" />
                  Admin portal
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to continue managing your clinic workspace.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <HiMail className="h-5 w-5 text-teal-700" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50/70 py-3 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                      placeholder="admin@clinix.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <HiLockClosed className="h-5 w-5 text-teal-700" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50/70 py-3 pl-12 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition hover:text-teal-700"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <HiEyeOff className="h-5 w-5" />
                      ) : (
                        <HiEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="remember"
                    className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600"
                  >
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className="text-sm font-bold text-teal-700 transition hover:text-teal-900"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-teal-800 hover:shadow-teal-900/20 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Signing in
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                  Demo access:{" "}
                  <span className="font-bold text-slate-700">
                    admin@clinix.com
                  </span>{" "}
                  /{" "}
                  <span className="font-bold text-slate-700">password123</span>
                </div>
              </form>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>
                &copy; {new Date().getFullYear()} CliniX Health System
              </span>
              <span>Protected workspace</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
