import React, { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || "";

const SCRIPT_ID = "google-identity-services";

export default function GoogleSignInButton({
  onCredential,
  text = "signin_with",
  width = 320,
}) {
  const buttonRef = useRef(null);
  const [error, setError] = useState(
    !GOOGLE_CLIENT_ID ? "Google sign-in is not configured." : "",
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return undefined;
    }

    let cancelled = false;

    const renderButton = () => {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;

      buttonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (!response?.credential || cancelled) return;
          onCredential?.(response.credential);
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width,
        text,
        shape: "pill",
      });
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.getElementById(SCRIPT_ID);
    const handleLoad = () => renderButton();
    const handleError = () => setError("Failed to load Google sign-in.");

    if (existing) {
      existing.addEventListener("load", handleLoad);
      existing.addEventListener("error", handleError);
    } else {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      const script = document.getElementById(SCRIPT_ID);
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, [onCredential, text, width]);

  return (
    <div className="space-y-2">
      <div ref={buttonRef} />
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
