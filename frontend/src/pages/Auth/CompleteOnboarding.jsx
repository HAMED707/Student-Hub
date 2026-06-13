import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, GraduationCap } from "lucide-react";
import { completeOnboarding } from "../../api/accounts.js";
import { getAuthSnapshot, getApiErrorMessage } from "../../utils/auth.js";

export default function CompleteOnboarding() {
  const navigate = useNavigate();
  const { user } = useMemo(() => getAuthSnapshot(), []);
  const [submittingRole, setSubmittingRole] = useState("");
  const [error, setError] = useState("");

  const chooseRole = async (role) => {
    try {
      setSubmittingRole(role);
      setError("");
      await completeOnboarding({ role });
      if (role === "landlord") {
        navigate("/owner/settings", {
          replace: true,
          state: { onboarding: true },
        });
        return;
      }
      navigate("/edit-profile", {
        replace: true,
        state: { onboarding: true },
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to complete onboarding"));
    } finally {
      setSubmittingRole("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-10">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#155BC2]">
          Finish setup
        </p>
        <h1 className="mt-3 text-3xl font-black text-[#091E42]">
          Welcome{user?.first_name ? `, ${user.first_name}` : ""} — choose your account type
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          We’ve verified your Google account. Choose the experience you need and we’ll take you to the right completion flow.
        </p>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => chooseRole("student")}
            disabled={Boolean(submittingRole)}
            className="rounded-3xl border border-slate-200 bg-white p-6 text-left transition hover:border-[#155BC2] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <GraduationCap className="h-8 w-8 text-[#155BC2]" />
            <h2 className="mt-4 text-xl font-black text-[#091E42]">Student</h2>
            <p className="mt-2 text-sm text-slate-500">
              Find housing, join community groups, match with roommates, and manage bookings.
            </p>
            <p className="mt-4 text-sm font-bold text-[#155BC2]">
              {submittingRole === "student" ? "Setting up..." : "Continue as student"}
            </p>
          </button>

          <button
            type="button"
            onClick={() => chooseRole("landlord")}
            disabled={Boolean(submittingRole)}
            className="rounded-3xl border border-slate-200 bg-white p-6 text-left transition hover:border-[#155BC2] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Briefcase className="h-8 w-8 text-[#155BC2]" />
            <h2 className="mt-4 text-xl font-black text-[#091E42]">Landlord</h2>
            <p className="mt-2 text-sm text-slate-500">
              List properties, manage student bookings, and handle owner verification from one dashboard.
            </p>
            <p className="mt-4 text-sm font-bold text-[#155BC2]">
              {submittingRole === "landlord" ? "Setting up..." : "Continue as landlord"}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
