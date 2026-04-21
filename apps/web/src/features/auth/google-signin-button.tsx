"use client";

import { useEffect, useRef, useState } from "react";
import { requestJson } from "../common/api";
import type { AuthSession } from "./session";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "small" | "medium" | "large";
      type?: "standard" | "icon";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
      locale?: string;
    }
  ) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

type GoogleSigninButtonProps = {
  apiBaseUrl: string;
  disabled: boolean;
  onSession: (session: AuthSession) => void;
  onError: (message: string) => void;
};

export function GoogleSigninButton({
  apiBaseUrl,
  disabled,
  onSession,
  onError
}: GoogleSigninButtonProps): JSX.Element | null {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const disabledRef = useRef(disabled);
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !googleClientId) {
      return;
    }

    let pollAttempts = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tryRenderButton = (): boolean => {
      const googleIdentity = window.google?.accounts?.id;
      if (!googleIdentity) {
        return false;
      }

      container.innerHTML = "";

      googleIdentity.initialize({
        client_id: googleClientId,
        use_fedcm_for_prompt: true,
        callback: (response) => {
          void handleGoogleLogin(response);
        }
      });

      googleIdentity.renderButton(container, {
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 320,
        text: "continue_with",
        locale: "no"
      });

      return true;
    };

    if (!tryRenderButton()) {
      intervalId = setInterval(() => {
        pollAttempts += 1;
        if (tryRenderButton() || pollAttempts >= 20) {
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      }, 300);
    }

    async function handleGoogleLogin(response: GoogleCredentialResponse): Promise<void> {
      if (disabledRef.current || isSubmittingRef.current) {
        return;
      }

      if (!response.credential) {
        onError("Google-innlogging feilet. Prøv igjen.");
        return;
      }

      setIsSubmitting(true);
      onError("");

      try {
        const authResponse = await requestJson<{ session: AuthSession }>(apiBaseUrl, "/api/auth/google", {
          method: "POST",
          body: JSON.stringify({ idToken: response.credential })
        });

        onSession(authResponse.session);
      } catch (error) {
        onError(error instanceof Error ? error.message : "Google-innlogging feilet");
      } finally {
        setIsSubmitting(false);
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [apiBaseUrl, googleClientId, onError, onSession]);

  if (!googleClientId) {
    return null;
  }

  return (
    <div>
      <div ref={containerRef} aria-live="polite" />
      {isSubmitting ? <p className="tiny">Logger inn med Google...</p> : null}
    </div>
  );
}
