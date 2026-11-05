"use client";

import { useEffect, useRef } from "react";

type GoogleCredential = { credential?: string };

type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredential) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: Record<string, string | number>
      ) => void;
    };
  };
};

export default function GoogleSignInButton({
  onCredential,
}: {
  onCredential: (credential: string) => void;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const holder = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!clientId || !holder.current) return;

    let cancelled = false;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (cancelled || !holder.current) return;
      const google = (window as Window & { google?: GoogleAccounts }).google;
      if (!google) return;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) onCredentialRef.current(response.credential);
        },
      });
      holder.current.innerHTML = "";
      google.accounts.id.renderButton(holder.current, {
        theme: "filled_black",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "pill",
      });
    };
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      script.remove();
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <p className="text-center text-sm text-white/40">
        Google sign-in needs a client id in the environment.
      </p>
    );
  }

  return <div ref={holder} className="flex min-h-11 justify-center" />;
}
