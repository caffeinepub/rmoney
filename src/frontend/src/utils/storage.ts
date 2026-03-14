export const getAdminSession = (): boolean =>
  localStorage.getItem("rmoney_admin_session") === "true";
export const setAdminSession = (v: boolean) =>
  v
    ? localStorage.setItem("rmoney_admin_session", "true")
    : localStorage.removeItem("rmoney_admin_session");
export const getUserSession = (): string | null =>
  localStorage.getItem("rmoney_user_session");
export const setUserSession = (id: string | null) =>
  id
    ? localStorage.setItem("rmoney_user_session", id)
    : localStorage.removeItem("rmoney_user_session");

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}
export function generateUserId(): string {
  return `RM${Math.floor(100000 + Math.random() * 900000)}`;
}
export function generateReferralCode(name = ""): string {
  const namePart = name
    .trim()
    .split(" ")[0]
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 5)
    .padEnd(3, "R");
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let rand = "";
  for (let i = 0; i < 4; i++)
    rand += chars[Math.floor(Math.random() * chars.length)];
  return `${namePart}${rand}`;
}
export function isValidUpi(upi: string): boolean {
  return (
    /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(upi) ||
    /^\d{10}@[a-zA-Z]{2,}$/.test(upi)
  );
}
