import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { User } from "../types";
import {
  generateId,
  generateOTP,
  generateReferralCode,
  generateUserId,
  getCompletions,
  getOTPStore,
  getTasks,
  getUserById,
  getUserSession,
  getUsers,
  getWithdrawals,
  saveCompletions,
  saveOTPStore,
  saveUsers,
  saveWithdrawals,
  setUserSession,
  todayStr,
  updateUser,
} from "../utils/storage";

// ─── OTP Login/Register ─────────────────────────────────────────────────────────
function AuthScreen({ onLogin }: { onLogin: (userId: string) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  // Login state
  const [lPhone, setLPhone] = useState("");
  const [lOtp, setLOtp] = useState("");
  const [lOtpSent, setLOtpSent] = useState(false);
  // Register state
  const [rName, setRName] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rRef, setRRef] = useState("");
  const [rOtp, setROtp] = useState("");
  const [rOtpSent, setROtpSent] = useState(false);

  const sendLoginOtp = () => {
    if (!lPhone || lPhone.length < 10) {
      toast.error("Enter valid phone number");
      return;
    }
    const users = getUsers();
    const user = users.find((u) => u.phone === lPhone);
    if (!user) {
      toast.error("Phone not registered. Please register first.");
      return;
    }
    const otp = generateOTP();
    saveOTPStore({ phone: lPhone, otp, expiry: Date.now() + 5 * 60 * 1000 });
    toast.info(`Your OTP (demo): ${otp}`, { duration: 30000 });
    setLOtpSent(true);
  };

  const verifyLoginOtp = () => {
    const store = getOTPStore();
    if (
      store &&
      store.phone === lPhone &&
      store.otp === lOtp &&
      store.expiry > Date.now()
    ) {
      const user = getUsers().find((u) => u.phone === lPhone);
      if (user) {
        saveOTPStore(null);
        setUserSession(user.id);
        onLogin(user.id);
        toast.success(`Welcome back, ${user.name}!`);
      }
    } else {
      toast.error("Invalid or expired OTP");
    }
  };

  const sendRegisterOtp = () => {
    if (!rName.trim()) {
      toast.error("Enter your name");
      return;
    }
    if (!rPhone || rPhone.length < 10) {
      toast.error("Enter valid phone number");
      return;
    }
    const existing = getUsers().find((u) => u.phone === rPhone);
    if (existing) {
      toast.error("Phone already registered. Please login.");
      return;
    }
    const otp = generateOTP();
    saveOTPStore({ phone: rPhone, otp, expiry: Date.now() + 5 * 60 * 1000 });
    toast.info(`Your OTP (demo): ${otp}`, { duration: 30000 });
    setROtpSent(true);
  };

  const verifyRegisterOtp = () => {
    const store = getOTPStore();
    if (
      store &&
      store.phone === rPhone &&
      store.otp === rOtp &&
      store.expiry > Date.now()
    ) {
      saveOTPStore(null);
      const newUser: User = {
        id: generateUserId(),
        name: rName.trim(),
        phone: rPhone,
        email: rEmail.trim() || undefined,
        profilePhoto: undefined,
        upiId: undefined,
        coinBalance: 0,
        referralCoinBalance: 0,
        referralCode: generateReferralCode(rName.trim()),
        referredBy: rRef.trim() || undefined,
        taskWithdrawalsToday: 0,
        lastWithdrawalDate: "",
        createdAt: new Date().toISOString(),
      };
      // Give 500 referral coins to referrer
      if (rRef.trim()) {
        const users = getUsers();
        const referrer = users.find(
          (u) => u.referralCode === rRef.trim().toUpperCase(),
        );
        if (referrer) {
          referrer.referralCoinBalance += 500;
          saveUsers(users.map((u) => (u.id === referrer.id ? referrer : u)));
          toast.success("Your referrer earned 500 coins!");
        }
      }
      const users = getUsers();
      saveUsers([...users, newUser]);
      setUserSession(newUser.id);
      onLogin(newUser.id);
      toast.success(
        `Welcome to RMoney, ${newUser.name}! Your ID: ${newUser.id}`,
      );
    } else {
      toast.error("Invalid or expired OTP");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[430px]">
        <div className="text-center mb-8">
          <div className="w-28 h-28 mx-auto mb-3 rounded-3xl shadow-coin overflow-hidden">
            <img
              src="/assets/uploads/WhatsApp-Image-2026-03-14-at-6.32.40-AM-1.jpeg"
              alt="RMoney"
              className="w-full h-full object-cover object-center scale-150"
            />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            RMoney
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Earn & Withdraw Real Money 💸
          </p>
        </div>

        <Card className="shadow-xl border-0 overflow-hidden">
          {/* Tab switcher */}
          <div className="flex">
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-semibold transition-all ${tab === "login" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
              onClick={() => setTab("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-semibold transition-all ${tab === "register" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
              onClick={() => setTab("register")}
            >
              Register
            </button>
          </div>

          <CardContent className="p-6 space-y-4">
            {tab === "login" ? (
              <>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    data-ocid="user.login.phone.input"
                    type="tel"
                    placeholder="10-Digit Mobile Number"
                    value={lPhone}
                    onChange={(e) => setLPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {!lOtpSent ? (
                  <Button
                    className="w-full bg-primary text-primary-foreground"
                    onClick={sendLoginOtp}
                  >
                    Send OTP
                  </Button>
                ) : (
                  <>
                    <div>
                      <Label>Enter OTP</Label>
                      <Input
                        data-ocid="user.login.otp.input"
                        placeholder="6-digit OTP"
                        value={lOtp}
                        onChange={(e) => setLOtp(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      data-ocid="user.login.submit_button"
                      className="w-full bg-primary text-primary-foreground"
                      onClick={verifyLoginOtp}
                    >
                      Verify & Login
                    </Button>
                    <button
                      type="button"
                      className="text-xs text-primary w-full text-center"
                      onClick={() => setLOtpSent(false)}
                    >
                      Resend OTP
                    </button>
                  </>
                )}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.info("Google login coming soon!")}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    viewBox="0 0 24 24"
                    aria-label="Google"
                    role="img"
                  >
                    <title>Google</title>
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign In With Google
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="Your Name"
                    value={rName}
                    onChange={(e) => setRName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    placeholder="10-Digit Mobile Number"
                    value={rPhone}
                    onChange={(e) => setRPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Gmail (optional)</Label>
                  <Input
                    type="email"
                    placeholder="you@gmail.com"
                    value={rEmail}
                    onChange={(e) => setREmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Referral Code (optional)</Label>
                  <Input
                    placeholder="Friend's Referral Code"
                    value={rRef}
                    onChange={(e) => setRRef(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {!rOtpSent ? (
                  <Button
                    className="w-full bg-primary text-primary-foreground"
                    onClick={sendRegisterOtp}
                  >
                    Send OTP
                  </Button>
                ) : (
                  <>
                    <div>
                      <Label>Enter OTP</Label>
                      <Input
                        placeholder="6-digit OTP"
                        value={rOtp}
                        onChange={(e) => setROtp(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      className="w-full bg-primary text-primary-foreground"
                      onClick={verifyRegisterOtp}
                    >
                      Verify & Register
                    </Button>
                    <button
                      type="button"
                      className="text-xs text-primary w-full text-center"
                      onClick={() => setROtpSent(false)}
                    >
                      Resend OTP
                    </button>
                  </>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.info("Google login coming soon!")}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    viewBox="0 0 24 24"
                    aria-label="Google"
                    role="img"
                  >
                    <title>Google</title>
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign Up With Google
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          Admin?{" "}
          <a href="/admin" className="text-primary font-medium hover:underline">
            Go to Admin Portal
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Home Tab ──────────────────────────────────────────────────────────────────
function HomeTab({ user }: { user: User }) {
  const completions = getCompletions().filter((c) => c.userId === user.id);
  const referrals = getUsers().filter(
    (u) => u.referredBy === user.referralCode,
  );
  const totalCoins = user.coinBalance + user.referralCoinBalance;
  const totalRs = totalCoins / 100;

  return (
    <div className="space-y-5 pb-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-emerald-600 rounded-2xl p-5 text-white">
        <p className="text-sm opacity-80">Welcome Back 👋</p>
        <h2 className="text-xl font-display font-bold mt-1">{user.name}</h2>
        <p className="text-xs opacity-70 font-mono mt-0.5">{user.id}</p>
        <div className="mt-4">
          <div className="flex items-end gap-1">
            <span className="text-4xl font-bold">₹{totalRs.toFixed(2)}</span>
          </div>
          <p className="text-xs opacity-70 mt-0.5">
            🪙 {totalCoins} coins total
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="pt-3 pb-3">
            <p className="text-2xl font-bold text-primary">
              {completions.length}
            </p>
            <p className="text-xs text-muted-foreground">Tasks Done</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-3 pb-3">
            <p className="text-2xl font-bold text-amber-500">
              {referrals.length}
            </p>
            <p className="text-xs text-muted-foreground">Referrals</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-3 pb-3">
            <p className="text-2xl font-bold text-emerald-600">
              ₹{totalRs.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-semibold text-amber-800">
            💡 How It Works
          </p>
          <ul className="text-xs text-amber-700 mt-2 space-y-1">
            <li>• Complete Tasks To Earn Coins</li>
            <li>• Refer Friends To Earn 500 Coins Per Referral</li>
            <li>• 1000 Coins = ₹10 (Withdraw Via UPI)</li>
            <li>• Min ₹10, Max ₹250 Per Withdrawal</li>
            <li>• Max 5 Task Withdrawals Per Day</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tasks Tab ─────────────────────────────────────────────────────────────────
function RulesCollapsible({ rules }: { rules: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-primary underline font-medium"
      >
        {open ? "Hide Rules ▲" : "View Rules ▼"}
      </button>
      {open && (
        <p className="mt-1 text-xs text-muted-foreground bg-muted/50 rounded p-2 whitespace-pre-line">
          {rules}
        </p>
      )}
    </div>
  );
}

function TasksTab({
  user,
  onUserUpdate,
}: { user: User; onUserUpdate: (u: User) => void }) {
  const tasks = getTasks()
    .filter((t) => t.active)
    .sort((a, b) => a.sequence - b.sequence);
  const completions = getCompletions();
  const completed = new Set(
    completions.filter((c) => c.userId === user.id).map((c) => c.taskId),
  );

  const handleComplete = (taskId: string, coins: number) => {
    if (completed.has(taskId)) return;
    const newCompletion = {
      id: generateId(),
      userId: user.id,
      taskId,
      completedAt: new Date().toISOString(),
    };
    saveCompletions([...getCompletions(), newCompletion]);
    const updated = { ...user, coinBalance: user.coinBalance + coins };
    updateUser(updated);
    onUserUpdate(updated);
    const rsEarned = (coins / 100).toFixed(2);
    toast.success(`🪙 +${coins} coins (₹${rsEarned}) earned!`);
  };

  return (
    <div className="pb-4">
      <h2 className="text-base font-semibold mb-3">Complete Tasks & Earn 💸</h2>
      {tasks.length === 0 ? (
        <Card data-ocid="user.tasks.empty_state">
          <CardContent className="py-12 text-center text-muted-foreground">
            No Tasks Available Right Now
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {tasks.map((task, idx) => {
            const done = completed.has(task.id);
            const rewardRs = (task.coinsReward / 100).toFixed(2);
            return (
              <div
                key={task.id}
                data-ocid={`user.tasks.item.${idx + 1}`}
                className="flex-shrink-0 w-72 snap-start"
              >
                <Card
                  className={`h-full ${done ? "opacity-70" : ""} border-2 ${done ? "border-primary/30" : "border-border"} shadow-sm`}
                >
                  <CardContent className="pt-4 pb-4 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {task.sequence}
                      </span>
                      {done && (
                        <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0">
                          ✓ Done
                        </Badge>
                      )}
                    </div>
                    {task.apkImageUrl && (
                      <img
                        src={task.apkImageUrl}
                        alt={task.title}
                        className="w-full h-24 object-cover rounded-lg mb-3"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <h3 className="font-semibold text-sm mb-1">{task.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2 flex-1">
                      {task.description}
                    </p>
                    {task.rules && <RulesCollapsible rules={task.rules} />}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-base font-bold text-emerald-600">
                          ₹{rewardRs}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          🪙 {task.coinsReward} coins
                        </span>
                      </div>
                      <a
                        href={task.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline"
                      >
                        Open Link
                      </a>
                    </div>
                    {!done && (
                      <Button
                        data-ocid={`user.tasks.complete_button.${idx + 1}`}
                        size="sm"
                        className="w-full bg-primary text-primary-foreground"
                        onClick={() =>
                          handleComplete(task.id, task.coinsReward)
                        }
                      >
                        Mark Complete
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Wallet Tab ─────────────────────────────────────────────────────────────────
function WalletTab({
  user,
  onUserUpdate,
}: { user: User; onUserUpdate: (u: User) => void }) {
  const [upiSave, setUpiSave] = useState(user.upiId ?? "");
  const [taskUpi, setTaskUpi] = useState(user.upiId ?? "");
  const [taskAmountRs, setTaskAmountRs] = useState("");
  const [refUpi, setRefUpi] = useState(user.upiId ?? "");
  const [refAmountRs, setRefAmountRs] = useState("");

  const saveUpi = () => {
    const updated = { ...user, upiId: upiSave.trim() };
    updateUser(updated);
    onUserUpdate(updated);
    toast.success("UPI ID saved!");
  };

  const handleTaskWithdraw = () => {
    const amountRs = Number(taskAmountRs);
    const coins = Math.round(amountRs * 100);

    if (!taskUpi.trim()) {
      toast.error("Enter your UPI ID");
      return;
    }
    if (!amountRs || amountRs < 10) {
      toast.error("Minimum withdrawal is ₹10");
      return;
    }
    if (amountRs > 250) {
      toast.error("Maximum withdrawal per request is ₹250");
      return;
    }
    if (user.coinBalance < coins) {
      toast.error("Insufficient balance");
      return;
    }

    const today = todayStr();
    const withdrawsToday =
      user.lastWithdrawalDate === today ? user.taskWithdrawalsToday : 0;
    if (withdrawsToday >= 5) {
      toast.error("Daily withdrawal limit (5) reached");
      return;
    }

    const req = {
      id: generateId(),
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      userUpiId: taskUpi.trim(),
      coins,
      amountRs,
      type: "task" as const,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };
    saveWithdrawals([...getWithdrawals(), req]);
    const updated = {
      ...user,
      coinBalance: user.coinBalance - coins,
      taskWithdrawalsToday: withdrawsToday + 1,
      lastWithdrawalDate: today,
    };
    updateUser(updated);
    onUserUpdate(updated);
    setTaskAmountRs("");
    toast.success(`Withdrawal request of ₹${amountRs.toFixed(2)} submitted!`);
  };

  const handleRefWithdraw = () => {
    const amountRs = Number(refAmountRs);
    const coins = Math.round(amountRs * 100);

    if (!refUpi.trim()) {
      toast.error("Enter your UPI ID");
      return;
    }
    if (!amountRs || amountRs < 10) {
      toast.error("Minimum withdrawal is ₹10");
      return;
    }
    if (amountRs > 250) {
      toast.error("Maximum withdrawal per request is ₹250");
      return;
    }
    const currentUser = getUserById(user.id);
    if (!currentUser || currentUser.referralCoinBalance < coins) {
      toast.error("Insufficient referral balance");
      return;
    }

    const req = {
      id: generateId(),
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      userUpiId: refUpi.trim(),
      coins,
      amountRs,
      type: "referral" as const,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };
    saveWithdrawals([...getWithdrawals(), req]);
    const updated = {
      ...currentUser,
      referralCoinBalance: currentUser.referralCoinBalance - coins,
    };
    updateUser(updated);
    onUserUpdate(updated);
    setRefAmountRs("");
    toast.success(`Referral withdrawal of ₹${amountRs.toFixed(2)} submitted!`);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional on mount only
  useEffect(() => {
    const u = getUserById(user.id);
    if (u) onUserUpdate(u);
  }, [user.id]); // eslint-disable-line

  const freshUser = getUserById(user.id) || user;

  return (
    <div className="space-y-5 pb-4">
      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-primary to-emerald-600 border-0 text-white">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs opacity-80">Task Balance</p>
            <p className="text-2xl font-bold">
              ₹{(freshUser.coinBalance / 100).toFixed(2)}
            </p>
            <p className="text-xs opacity-70">
              🪙 {freshUser.coinBalance} coins
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 border-0 text-white">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs opacity-80">Referral Balance</p>
            <p className="text-2xl font-bold">
              ₹{(freshUser.referralCoinBalance / 100).toFixed(2)}
            </p>
            <p className="text-xs opacity-70">
              🪙 {freshUser.referralCoinBalance} coins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* UPI ID */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-2">
          <Label className="font-semibold">Your UPI ID</Label>
          <div className="flex gap-2">
            <Input
              data-ocid="user.wallet.upi.input"
              value={upiSave}
              onChange={(e) => setUpiSave(e.target.value)}
              placeholder="yourname@upi"
              className="flex-1"
            />
            <Button
              onClick={saveUpi}
              className="bg-primary text-primary-foreground"
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Withdrawal */}
      <Card className="border-primary/30">
        <CardContent className="pt-4 pb-4 space-y-3">
          <p className="font-semibold text-sm">💰 Task Withdrawal</p>
          <p className="text-xs text-muted-foreground">
            Min ₹10 • Max ₹250 • 5/Day
          </p>
          <div>
            <Label className="text-xs">UPI ID</Label>
            <Input
              data-ocid="user.wallet.withdraw.upi.input"
              value={taskUpi}
              onChange={(e) => setTaskUpi(e.target.value)}
              placeholder="Enter UPI ID For Payment"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Amount (₹)</Label>
            <Input
              data-ocid="user.wallet.withdraw.coins.input"
              type="number"
              value={taskAmountRs}
              onChange={(e) => setTaskAmountRs(e.target.value)}
              placeholder="Enter amount in ₹ (10–250)"
              className="mt-1"
            />
            {taskAmountRs && Number(taskAmountRs) >= 10 && (
              <p className="text-xs text-primary mt-1">
                = 🪙 {Math.round(Number(taskAmountRs) * 100)} coins
              </p>
            )}
          </div>
          <Button
            data-ocid="user.wallet.withdraw.submit_button"
            className="w-full bg-primary text-primary-foreground"
            onClick={handleTaskWithdraw}
          >
            Request Withdrawal
          </Button>
        </CardContent>
      </Card>

      {/* Referral Withdrawal */}
      <Card className="border-amber-300">
        <CardContent className="pt-4 pb-4 space-y-3">
          <p className="font-semibold text-sm">🎁 Referral Withdrawal</p>
          <p className="text-xs text-muted-foreground">
            Min ₹10 • Max ₹250 • 1000 Coins = ₹10
          </p>
          <div>
            <Label className="text-xs">UPI ID</Label>
            <Input
              data-ocid="user.wallet.referral_withdraw.upi.input"
              value={refUpi}
              onChange={(e) => setRefUpi(e.target.value)}
              placeholder="Enter UPI ID For Payment"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Amount (₹)</Label>
            <Input
              type="number"
              value={refAmountRs}
              onChange={(e) => setRefAmountRs(e.target.value)}
              placeholder="Enter amount in ₹ (10–250)"
              className="mt-1"
            />
            {refAmountRs && Number(refAmountRs) >= 10 && (
              <p className="text-xs text-amber-600 mt-1">
                = 🪙 {Math.round(Number(refAmountRs) * 100)} coins
              </p>
            )}
          </div>
          <Button
            data-ocid="user.wallet.referral_withdraw.submit_button"
            className="w-full bg-amber-500 text-white hover:bg-amber-600"
            onClick={handleRefWithdraw}
          >
            Request Referral Withdrawal
          </Button>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="font-semibold text-sm mb-3">Withdrawal History</p>
          <div className="space-y-2">
            {getWithdrawals()
              .filter((w) => w.userId === user.id)
              .slice()
              .reverse()
              .map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between text-xs py-2 border-b border-border last:border-0"
                >
                  <div>
                    <span className="font-medium">
                      {w.type === "task" ? "Task" : "Referral"}
                    </span>
                    <p className="text-muted-foreground">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-muted-foreground font-mono">
                      {w.userUpiId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{w.amountRs.toFixed(2)}</p>
                    <Badge
                      className={`text-xs ${
                        w.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : w.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      } border-0`}
                    >
                      {w.status}
                    </Badge>
                  </div>
                </div>
              ))}
            {getWithdrawals().filter((w) => w.userId === user.id).length ===
              0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No Withdrawal Requests Yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Referral Tab ──────────────────────────────────────────────────────────────
function ReferralTab({ user }: { user: User }) {
  const referrals = getUsers().filter(
    (u) => u.referredBy === user.referralCode,
  );

  const copyCode = () => {
    navigator.clipboard.writeText(user.referralCode).then(() => {
      toast.success("Referral code copied!");
    });
  };

  const shareText = `Join RMoney and earn real money! Use my referral code: ${user.referralCode} and get started. Download now!`;

  return (
    <div className="space-y-5 pb-4">
      {/* Referral Code Card */}
      <Card className="bg-gradient-to-br from-primary to-emerald-700 border-0 text-white">
        <CardContent className="pt-5 pb-5 text-center">
          <p className="text-sm opacity-80 mb-2">Your Referral Code</p>
          <p className="text-3xl font-bold font-mono tracking-widest mb-4">
            {user.referralCode}
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              data-ocid="user.referral.copy_button"
              variant="secondary"
              size="sm"
              onClick={copyCode}
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              📋 Copy Code
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "RMoney", text: shareText });
                } else {
                  navigator.clipboard.writeText(shareText);
                  toast.success("Share text copied!");
                }
              }}
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              🔗 Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Info */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-primary">
              {referrals.length}
            </p>
            <p className="text-xs text-muted-foreground">Friends Referred</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-amber-500">
              ₹{(user.referralCoinBalance / 100).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              🪙 {user.referralCoinBalance} coins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-semibold text-emerald-800 mb-2">
            🎁 Referral Rewards
          </p>
          <ul className="text-xs text-emerald-700 space-y-1">
            <li>• Share Your Unique Referral Code</li>
            <li>
              • Earn <strong>500 Coins (₹5)</strong> Per Friend Who Registers
            </li>
            <li>
              • <strong>1000 coins = ₹10</strong>
            </li>
            <li>• Withdraw Min ₹10, Max ₹250 Via UPI In Wallet Tab</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({
  user,
  onUserUpdate,
  onLogout,
}: { user: User; onUserUpdate: (u: User) => void; onLogout: () => void }) {
  const [name, setName] = useState(user.name);
  const [upiId, setUpiId] = useState(user.upiId ?? "");
  const [photo, setPhoto] = useState(user.profilePhoto ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhoto(base64);
      const updated = { ...user, profilePhoto: base64 };
      updateUser(updated);
      onUserUpdate(updated);
      toast.success("Profile photo updated! 📸");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    const updated = {
      ...user,
      name: name.trim(),
      upiId: upiId.trim() || undefined,
      profilePhoto: photo || undefined,
    };
    updateUser(updated);
    onUserUpdate(updated);
    toast.success("Profile updated!");
  };

  return (
    <div className="space-y-5 pb-4">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-primary/30 shadow-lg">
            <AvatarImage src={photo} alt={user.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg text-sm"
            onClick={() => fileInputRef.current?.click()}
            title="Update photo"
          >
            📷
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <Button
          data-ocid="user.profile.photo.upload_button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs"
        >
          📷 Update Photo
        </Button>
        <div className="text-center">
          <p className="font-semibold">{user.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              data-ocid="user.profile.name.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>User ID</Label>
            <Input
              value={user.id}
              disabled
              className="mt-1 font-mono text-xs bg-muted"
            />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input value={user.phone} disabled className="mt-1 bg-muted" />
          </div>
          <div>
            <Label>UPI ID</Label>
            <Input
              data-ocid="user.profile.upi.input"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="mt-1"
            />
          </div>
          <Button
            data-ocid="user.profile.save_button"
            className="w-full bg-primary text-primary-foreground"
            onClick={handleSave}
          >
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        onClick={() => {
          setUserSession(null);
          onLogout();
        }}
      >
        Logout
      </Button>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pb-2">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Built with ❤️ using caffeine.ai
        </a>
      </p>
    </div>
  );
}

// ─── User App (after login) ────────────────────────────────────────────────────
type UserTab = "home" | "tasks" | "wallet" | "referral" | "profile";

function UserApp({ userId }: { userId: string }) {
  const [tab, setTab] = useState<UserTab>("home");
  const [user, setUser] = useState<User | null>(
    () => getUserById(userId) ?? null,
  );

  if (!user) return null;

  const updateAndRefresh = (u: User) => setUser(u);

  const navItems: { id: UserTab; icon: string; label: string }[] = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "tasks", icon: "✅", label: "Tasks" },
    { id: "wallet", icon: "💰", label: "Wallet" },
    { id: "referral", icon: "🎁", label: "Refer" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col relative">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src="/assets/uploads/WhatsApp-Image-2026-03-14-at-6.32.40-AM-1.jpeg"
                alt="RMoney"
                className="w-full h-full object-cover object-center scale-150"
              />
            </div>
            <span className="font-display font-bold text-primary">RMoney</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {user.id}
            </span>
            <Avatar className="w-7 h-7">
              <AvatarImage src={user.profilePhoto} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 pt-4">
          {tab === "home" && <HomeTab user={user} />}
          {tab === "tasks" && (
            <TasksTab user={user} onUserUpdate={updateAndRefresh} />
          )}
          {tab === "wallet" && (
            <WalletTab user={user} onUserUpdate={updateAndRefresh} />
          )}
          {tab === "referral" && <ReferralTab user={user} />}
          {tab === "profile" && (
            <ProfileTab
              user={user}
              onUserUpdate={updateAndRefresh}
              onLogout={() => window.location.reload()}
            />
          )}
        </main>

        {/* Bottom Nav */}
        <nav className="sticky bottom-0 z-10 bg-white/95 backdrop-blur border-t border-border flex">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              data-ocid={`user.${item.id}.tab`}
              className={`flex-1 flex flex-col items-center py-2 transition-colors ${
                tab === item.id ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => setTab(item.id)}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium mt-0.5">
                {item.label}
              </span>
              {tab === item.id && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ─── User Portal Root ──────────────────────────────────────────────────────────
export default function UserPortal() {
  const [userId, setUserId] = useState<string | null>(getUserSession);

  if (userId && getUserById(userId)) {
    return <UserApp userId={userId} />;
  }

  return <AuthScreen onLogin={(id) => setUserId(id)} />;
}
