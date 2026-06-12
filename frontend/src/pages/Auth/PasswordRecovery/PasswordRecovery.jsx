import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info, Mail } from "lucide-react";

const PasswordRecovery = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white font-sans">
      <div className="flex h-full w-full flex-col justify-center px-12 md:px-24 lg:w-[60%]">
        <div className="mx-auto w-full max-w-md">
          <button
            onClick={() => navigate("/login")}
            className="mb-8 flex items-center gap-2 text-gray-500 transition-colors hover:text-[#1A56DB]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to login
          </button>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm">
              <Info className="h-7 w-7" />
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900">
              Password recovery is not live yet
            </h1>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              The backend does not currently provide a reset-password API, so we
              disabled the old fake recovery flow to avoid misleading users.
            </p>

            <div className="mt-6 rounded-2xl border border-white bg-white/80 p-4 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-[#1A56DB]" />
                <span>
                  For now, return to login or ask an admin/support contact to
                  reset the account manually.
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/login")}
              className="mt-8 h-12 w-full rounded-xl bg-[#1A56DB] font-bold text-white transition hover:bg-blue-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>

      <div className="relative hidden w-[40%] items-center justify-center overflow-hidden bg-[#3245FF] lg:flex">
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 500 500" className="h-full w-full">
            <path
              d="M0,100 C150,200 350,0 500,100 L500,500 L0,500 Z"
              fill="white"
            />
          </svg>
        </div>

        <div className="relative z-10 h-[75%] w-[80%]">
          <div className="absolute inset-0 rounded-[45px] border border-white/20 bg-white/10 backdrop-blur-md" />
          <div className="absolute left-10 top-12 z-30 max-w-[280px]">
            <h2 className="mb-4 text-2xl font-bold text-white">
              We paused this flow until the real backend support lands.
            </h2>
            <p className="text-sm leading-6 text-blue-100/90">
              That keeps authentication honest and avoids a fake “success”
              experience for users.
            </p>
          </div>
          <div className="relative flex h-full items-end justify-center overflow-hidden rounded-[45px]">
            <img
              src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop"
              alt="Password recovery"
              className="h-[85%] w-[90%] rounded-t-[30px] object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordRecovery;
