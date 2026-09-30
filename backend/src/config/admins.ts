/** Emails listed in ADMIN_EMAILS are promoted to ADMIN every time they sign in. */
export function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isConfiguredAdmin(email?: string | null) {
  return !!email && adminEmails().includes(email.toLowerCase());
}
