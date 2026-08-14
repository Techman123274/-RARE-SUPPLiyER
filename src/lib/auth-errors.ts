const GENERIC_NETWORK = "SOMETHING WENT WRONG. PLEASE TRY AGAIN.";

export const AUTH_NOTICES = {
  expired: "THIS VERIFICATION LINK HAS EXPIRED. REQUEST A NEW ONE FROM SIGN IN.",
  "expired-reset": "THIS PASSWORD RESET LINK HAS EXPIRED.",
  invalid: "THIS LINK IS INVALID OR HAS ALREADY BEEN USED.",
  verified: "THIS ACCOUNT IS ALREADY VERIFIED. YOU CAN SIGN IN.",
  generic: GENERIC_NETWORK,
} as const;

export type AuthNoticeCode = keyof typeof AUTH_NOTICES;

export function noticeFromCode(code: string | null): string | null {
  if (!code) return null;
  if (code in AUTH_NOTICES) return AUTH_NOTICES[code as AuthNoticeCode];
  return null;
}

export function mapAuthError(error: { message?: string; code?: string } | null | undefined): string {
  if (!error) return GENERIC_NETWORK;

  const code = (error.code ?? "").toLowerCase();
  const message = (error.message ?? "").toLowerCase();

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return "EMAIL OR PASSWORD IS INCORRECT.";
  }

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "PLEASE VERIFY YOUR EMAIL BEFORE SIGNING IN.";
  }

  if (
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("user already exists")
  ) {
    return "AN ACCOUNT WITH THIS EMAIL MAY ALREADY EXIST. TRY SIGNING IN OR RESETTING YOUR PASSWORD.";
  }

  if (
    code === "weak_password" ||
    message.includes("password should be") ||
    message.includes("password is known") ||
    message.includes("weak password")
  ) {
    return "PLEASE CHOOSE A STRONGER PASSWORD.";
  }

  if (
    code === "otp_expired" ||
    message.includes("expired") ||
    message.includes("otp_expired")
  ) {
    return "THIS PASSWORD RESET LINK HAS EXPIRED.";
  }

  if (message.includes("invalid") && (message.includes("token") || message.includes("link") || message.includes("otp"))) {
    return "THIS LINK IS INVALID OR HAS ALREADY BEEN USED.";
  }

  if (code === "over_email_send_rate_limit" || message.includes("rate limit")) {
    return "PLEASE WAIT A MOMENT BEFORE TRYING AGAIN.";
  }

  return GENERIC_NETWORK;
}

export function mapAuthCallbackNotice(errorCode: string | null, errorDescription: string | null): AuthNoticeCode {
  const combined = `${errorCode ?? ""} ${errorDescription ?? ""}`.toLowerCase();

  if (combined.includes("otp_expired") || combined.includes("expired")) {
    return "expired";
  }

  if (combined.includes("already") && combined.includes("confirm")) {
    return "verified";
  }

  if (combined.includes("access_denied") || combined.includes("invalid")) {
    return "invalid";
  }

  return "generic";
}

