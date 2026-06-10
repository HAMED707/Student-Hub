import { useNavigate } from "react-router-dom";
import { Facebook, Globe, Instagram, Mail, Phone, Twitter } from "lucide-react";

import logoFull from "../../brand/icons/logo.svg";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-[#091E42] px-4 py-12 text-white">
      <div className="mx-auto grid w-full max-w-[1500px] gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <img
            src={logoFull}
            alt="StudentHub"
            className="h-12 w-auto rounded-lg bg-white px-3 py-2"
          />
          <p className="mt-4 text-sm leading-6 text-white/70">
            Find trusted student accommodation near universities across Egypt.
          </p>
          <div className="mt-6 flex gap-3">
            {[Facebook, Instagram, Twitter].map((Icon, index) => (
              <a
                key={index}
                href="https://studenthub.com"
                target="_blank"
                rel="noreferrer"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
                aria-label="Social link"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-extrabold">Quick Links</h3>
          <div className="mt-5 flex flex-col gap-3 text-sm text-white/70">
            <button type="button" onClick={() => navigate("/home")} className="text-left transition hover:text-white">
              Home
            </button>
            <button type="button" onClick={() => navigate("/find-room")} className="text-left transition hover:text-white">
              Find Room
            </button>
            <button type="button" onClick={() => navigate("/my-bookings")} className="text-left transition hover:text-white">
              My Bookings
            </button>
            <button type="button" onClick={() => navigate("/favorites")} className="text-left transition hover:text-white">
              Favorites
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-extrabold">Contact</h3>
          <div className="mt-5 space-y-4 text-sm text-white/70">
            <p className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#A0C4FF]" /> support@studenthub.com
            </p>
            <p className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-[#A0C4FF]" /> +20 100 000 0000
            </p>
            <p className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-[#A0C4FF]" /> www.studenthub.com
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-extrabold">Newsletter</h3>
          <p className="mt-4 text-sm leading-6 text-white/70">
            Get new rooms and student offers in your inbox.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="h-11 rounded-xl border border-white/10 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/50"
            />
            <button
              type="button"
              className="h-11 rounded-xl bg-[#155BC2] text-sm font-bold transition hover:bg-[#0f4699]"
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-[1500px] flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
        <p>© 2026 StudentHub. All rights reserved.</p>
        <div className="flex gap-5">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}
