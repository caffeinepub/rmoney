import type {
  AdminWallet,
  OTPStore,
  Task,
  TaskCompletion,
  User,
  WithdrawalRequest,
} from "../types";

const KEYS = {
  USERS: "rmoney_users",
  TASKS: "rmoney_tasks",
  COMPLETIONS: "rmoney_task_completions",
  WITHDRAWALS: "rmoney_withdrawal_requests",
  ADMIN_WALLET: "rmoney_admin_wallet",
  ADMIN_SESSION: "rmoney_admin_session",
  USER_SESSION: "rmoney_user_session",
  OTP_STORE: "rmoney_otp_store",
};

function get<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultVal;
    return JSON.parse(raw) as T;
  } catch {
    return defaultVal;
  }
}

function set<T>(key: string, val: T): void {
  localStorage.setItem(key, JSON.stringify(val));
}

export const getUsers = (): User[] => get<User[]>(KEYS.USERS, []);
export const saveUsers = (users: User[]) => set(KEYS.USERS, users);
export const getUserById = (id: string): User | undefined =>
  getUsers().find((u) => u.id === id);
export const updateUser = (updated: User) => {
  const users = getUsers();
  saveUsers(users.map((u) => (u.id === updated.id ? updated : u)));
};

export const getTasks = (): Task[] =>
  get<Task[]>(KEYS.TASKS, [
    {
      id: "task1",
      sequence: 1,
      title: "Download CashKaro App",
      description:
        "Install CashKaro from the link below, register and earn rewards.",
      url: "https://cashkaro.com",
      apkImageUrl: "",
      coinsReward: 500,
      active: true,
    },
    {
      id: "task2",
      sequence: 2,
      title: "Join Telegram Channel",
      description:
        "Join our official Telegram channel and stay updated with new tasks.",
      url: "https://t.me/rmoney_official",
      apkImageUrl: "",
      coinsReward: 300,
      active: true,
    },
    {
      id: "task3",
      sequence: 3,
      title: "Install EarnKaro App",
      description:
        "Download EarnKaro app and complete signup to earn bonus coins.",
      url: "https://earnkaro.com",
      apkImageUrl: "",
      coinsReward: 750,
      active: true,
    },
    {
      id: "task4",
      sequence: 4,
      title: "Follow on Instagram",
      description: "Follow our Instagram page and like 3 recent posts.",
      url: "https://instagram.com/rmoney_app",
      apkImageUrl: "",
      coinsReward: 200,
      active: true,
    },
  ]);
export const saveTasks = (tasks: Task[]) => set(KEYS.TASKS, tasks);

export const getCompletions = (): TaskCompletion[] =>
  get<TaskCompletion[]>(KEYS.COMPLETIONS, []);
export const saveCompletions = (c: TaskCompletion[]) =>
  set(KEYS.COMPLETIONS, c);

export const getWithdrawals = (): WithdrawalRequest[] =>
  get<WithdrawalRequest[]>(KEYS.WITHDRAWALS, []);
export const saveWithdrawals = (w: WithdrawalRequest[]) =>
  set(KEYS.WITHDRAWALS, w);

const DEFAULT_WALLET: AdminWallet = {
  balance: 5000,
  upiId: "",
  transactions: [],
};
export const getAdminWallet = (): AdminWallet =>
  get<AdminWallet>(KEYS.ADMIN_WALLET, DEFAULT_WALLET);
export const saveAdminWallet = (w: AdminWallet) => set(KEYS.ADMIN_WALLET, w);

export const getAdminSession = (): boolean =>
  localStorage.getItem(KEYS.ADMIN_SESSION) === "true";
export const setAdminSession = (v: boolean) =>
  v
    ? localStorage.setItem(KEYS.ADMIN_SESSION, "true")
    : localStorage.removeItem(KEYS.ADMIN_SESSION);

export const getUserSession = (): string | null =>
  localStorage.getItem(KEYS.USER_SESSION);
export const setUserSession = (id: string | null) =>
  id
    ? localStorage.setItem(KEYS.USER_SESSION, id)
    : localStorage.removeItem(KEYS.USER_SESSION);

export const getOTPStore = (): OTPStore | null =>
  get<OTPStore | null>(KEYS.OTP_STORE, null);
export const saveOTPStore = (otp: OTPStore | null) =>
  otp ? set(KEYS.OTP_STORE, otp) : localStorage.removeItem(KEYS.OTP_STORE);

export function generateUserId(): string {
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  return `RM${digits}`;
}

/**
 * Generates a personalized referral code based on the user's name.
 * Format: first 4-5 letters of name (uppercase) + 4 random alphanumeric chars.
 * e.g. name "Rahul Kumar" → "RAHU3X9K"
 * Ensures uniqueness by retrying if the code is already taken.
 */
export function generateReferralCode(name = ""): string {
  const suffix = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  // Take up to 5 letters from the first word of the name, strip non-alpha
  const namePart = name
    .trim()
    .split(" ")[0]
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 5)
    .padEnd(3, "R"); // minimum 3 chars if name is very short

  const existingCodes = new Set(getUsers().map((u) => u.referralCode));

  for (let attempt = 0; attempt < 20; attempt++) {
    let rand = "";
    for (let i = 0; i < 4; i++) {
      rand += suffix[Math.floor(Math.random() * suffix.length)];
    }
    const code = `${namePart}${rand}`;
    if (!existingCodes.has(code)) return code;
  }

  // Fallback: fully random 8 chars
  let fallback = "";
  for (let i = 0; i < 8; i++) {
    fallback += suffix[Math.floor(Math.random() * suffix.length)];
  }
  return fallback;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}
