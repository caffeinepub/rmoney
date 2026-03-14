import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Camera,
  CheckCircle,
  ChevronRight,
  Coins,
  Copy,
  Home,
  ListTodo,
  Loader2,
  LogOut,
  Share2,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  RMTask,
  RMTaskCompletion,
  RMUser,
  RMWithdrawalRequest,
} from "../backend.d";
import { useUpload } from "../blob-storage/hooks";
import { useActor } from "../hooks/useActor";
import {
  generateId,
  generateOTP,
  generateReferralCode,
  generateUserId,
  getUserSession,
  isValidUpi,
  setUserSession,
  todayStr,
} from "../utils/storage";

// Social brand colors
const SOCIAL = [
  {
    name: "WHATSAPP",
    color: "#25D366",
    bg: "#25D366",
    getUrl: (link: string) =>
      `https://wa.me/?text=${encodeURIComponent(`Join RMoney and earn real money! Use my referral link: ${link}`)}`,
    icon: "W",
  },
  {
    name: "TELEGRAM",
    color: "#0088CC",
    bg: "#0088CC",
    getUrl: (link: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Join RMoney! Earn real money completing tasks!")}`,
    icon: "T",
  },
  {
    name: "FACEBOOK",
    color: "#1877F2",
    bg: "#1877F2",
    getUrl: (link: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    icon: "F",
  },
  {
    name: "INSTAGRAM",
    color: "#E1306C",
    bg: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
    getUrl: (_link: string) => "https://instagram.com",
    icon: "I",
  },
  {
    name: "GMAIL",
    color: "#EA4335",
    bg: "#EA4335",
    getUrl: (link: string) =>
      `mailto:?subject=Join RMoney!&body=${encodeURIComponent(`Join RMoney and earn real money! My referral link: ${link}`)}`,
    icon: "G",
  },
];

type Tab = "home" | "tasks" | "wallet" | "refer" | "profile";

export default function UserPortal() {
  const { actor } = useActor();
  const [userId, setUserId] = useState<string | null>(getUserSession);
  const [user, setUser] = useState<RMUser | null>(null);
  const [tasks, setTasks] = useState<RMTask[]>([]);
  const [completions, setCompletions] = useState<RMTaskCompletion[]>([]);
  const [allUsers, setAllUsers] = useState<RMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("home");
  const actorRef = useRef<any>(null);

  useEffect(() => {
    if (actor) actorRef.current = actor;
  }, [actor]);

  const loadData = async () => {
    const a = actorRef.current;
    if (!a) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const [result, t, c, u] = await Promise.all([
        a.getUserById(userId),
        a.getTasks(),
        a.getCompletionsByUser(userId),
        a.getAllUsers(),
      ]);
      if (result.length > 0) setUser(result[0]);
      setTasks(t.filter((tk: RMTask) => tk.active));
      setCompletions(c);
      setAllUsers(u);
    } catch (e) {
      console.error("Load error", e);
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: polling interval intentional
  useEffect(() => {
    if (!actor) return;
    actorRef.current = actor;
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [userId, actor]);

  const handleLogout = () => {
    setUserSession(null);
    setUserId(null);
    setUser(null);
  };

  if (loading && !user && userId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, #ff6b35 0%, #f7c948 50%, #ff4d6d 100%)",
        }}
      >
        <div className="text-center text-white">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-4 border-white shadow-xl">
            <img
              src="/assets/uploads/WhatsApp-Image-2026-03-14-at-6.32.40-AM-1-1.jpeg"
              alt="RMMONEY"
              className="w-full h-full object-cover scale-[2.2]"
            />
          </div>
          <p className="font-bold text-xl tracking-widest">RMMONEY ₹</p>
          <Loader2 className="animate-spin mx-auto mt-4" size={28} />
        </div>
      </div>
    );
  }

  if (!userId || !user) {
    return (
      <AuthScreen
        actor={actor}
        onLogin={(id) => {
          setUserId(id);
          setUserSession(id);
        }}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #fff1f2 100%)",
      }}
    >
      {/* Portrait warning */}
      <div className="portrait-only-overlay hidden fixed inset-0 z-50 bg-black/90 items-center justify-center text-white text-center p-8">
        <div>
          <p className="text-3xl mb-4">🔄</p>
          <p className="font-bold text-xl">PLEASE ROTATE YOUR PHONE</p>
          <p className="text-sm mt-2 opacity-70">
            This app works best in portrait mode
          </p>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-yellow-400">
            <img
              src="/assets/uploads/WhatsApp-Image-2026-03-14-at-6.32.40-AM-1-1.jpeg"
              alt="RM"
              className="w-full h-full object-cover scale-[2.2]"
            />
          </div>
          <span className="font-bold text-lg tracking-widest text-yellow-400">
            RMMONEY ₹
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs text-gray-400">BALANCE</p>
            <p className="font-bold text-yellow-400">
              🪙 {Number(user.coinBalance)} = ₹
              {(Number(user.coinBalance) / 100).toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-white"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {tab === "home" && (
          <HomeTab user={user} completions={completions} tasks={tasks} />
        )}
        {tab === "tasks" && (
          <TasksTab
            user={user}
            tasks={tasks}
            completions={completions}
            actor={actor}
            actorRef={actorRef}
            onRefresh={loadData}
          />
        )}
        {tab === "wallet" && (
          <WalletTab
            user={user}
            actor={actor}
            actorRef={actorRef}
            onRefresh={loadData}
          />
        )}
        {tab === "refer" && <ReferTab user={user} allUsers={allUsers} />}
        {tab === "profile" && (
          <ProfileTab
            user={user}
            actor={actor}
            actorRef={actorRef}
            onRefresh={loadData}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 flex z-40">
        {[
          { id: "home" as Tab, icon: Home, label: "HOME" },
          { id: "tasks" as Tab, icon: ListTodo, label: "TASKS" },
          { id: "wallet" as Tab, icon: Wallet, label: "WALLET" },
          { id: "refer" as Tab, icon: Users, label: "REFER" },
          { id: "profile" as Tab, icon: Camera, label: "PROFILE" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            type="button"
            key={id}
            data-ocid={`nav.${id}.tab`}
            onClick={() => setTab(id)}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors ${
              tab === id ? "text-yellow-400" : "text-gray-500"
            }`}
          >
            <Icon size={20} />
            <span className="text-[9px] font-bold tracking-wider">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// AUTH SCREEN
// ──────────────────────────────────────────────────────────────
type AuthMode = "select" | "login" | "register";

function AuthScreen({
  actor,
  onLogin,
}: { actor: any; onLogin: (id: string) => void }) {
  const [mode, setMode] = useState<AuthMode>("select");

  // LOGIN state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  // REGISTER state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBusy, setRegBusy] = useState(false);
  const [refCode, setRefCode] = useState(
    () => new URLSearchParams(window.location.search).get("ref") || "",
  );

  // LOGIN handler
  const handleLogin = async () => {
    if (!loginPhone.match(/^[6-9]\d{9}$/)) {
      toast.error("ENTER VALID 10-DIGIT MOBILE NUMBER");
      return;
    }
    if (!loginPassword.trim()) {
      toast.error("ENTER YOUR PASSWORD");
      return;
    }
    setLoginBusy(true);
    try {
      if (actor) {
        const result = await actor.getUserByPhone(loginPhone);
        if (!result || result.length === 0) {
          toast.error("NUMBER NOT REGISTERED. PLEASE REGISTER FIRST.");
          setMode("select");
          return;
        }
        const valid = await actor.verifyPassword(loginPhone, loginPassword);
        if (valid) {
          toast.success("WELCOME BACK!");
          onLogin(result[0].id);
        } else {
          toast.error("WRONG PASSWORD. TRY AGAIN.");
        }
      } else {
        toast.error("SERVER NOT READY. PLEASE TRY AGAIN IN A MOMENT.");
      }
    } catch {
      toast.error("LOGIN FAILED. PLEASE TRY AGAIN.");
    } finally {
      setLoginBusy(false);
    }
  };

  // REGISTER handler
  const handleRegister = async () => {
    if (!regName.trim()) {
      toast.error("ENTER YOUR FULL NAME");
      return;
    }
    if (!regPhone.match(/^[6-9]\d{9}$/)) {
      toast.error("ENTER VALID 10-DIGIT MOBILE NUMBER");
      return;
    }
    if (!regPassword.trim() || regPassword.length < 4) {
      toast.error("PASSWORD MUST BE AT LEAST 4 CHARACTERS");
      return;
    }
    if (!actor) {
      toast.error("SERVER NOT READY. PLEASE WAIT A MOMENT AND TRY AGAIN.");
      return;
    }
    setRegBusy(true);
    try {
      const existing = await actor.getUserByPhone(regPhone);
      if (existing && existing.length > 0) {
        toast.error("NUMBER ALREADY REGISTERED. PLEASE LOGIN.");
        setMode("login");
        setLoginPhone(regPhone);
        return;
      }

      const newUser = {
        id: generateId(),
        phone: regPhone,
        name: regName.trim().toUpperCase(),
        userId: generateUserId(),
        referralCode: generateReferralCode(regName),
        referredBy: refCode.trim().toUpperCase(),
        profilePhotoUrl: "",
        upiId: "",
        upiLocked: false,
        coinBalance: BigInt(0),
        referralCoinBalance: BigInt(0),
        hasCompletedFirstTask: false,
        taskWithdrawalsToday: BigInt(0),
        lastWithdrawalDate: "",
        createdAt: BigInt(Date.now()),
      };

      const ok = await actor.registerUser(newUser);
      if (ok) {
        await actor.savePassword(regPhone, regPassword);
        setUserSession(newUser.id);
        toast.success("REGISTRATION SUCCESSFUL! WELCOME!");
        onLogin(newUser.id);
      } else {
        toast.error("NUMBER ALREADY REGISTERED. PLEASE LOGIN.");
        setMode("login");
        setLoginPhone(regPhone);
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("REGISTRATION FAILED. PLEASE TRY AGAIN.");
    } finally {
      setRegBusy(false);
    }
  };

  const Logo = () => (
    <div className="text-center mb-8">
      <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 border-4 border-white shadow-xl">
        <img
          src="/assets/uploads/WhatsApp-Image-2026-03-14-at-6.32.40-AM-1-1.jpeg"
          alt="RMMONEY"
          className="w-full h-full object-cover scale-[2.2]"
        />
      </div>
      <h1 className="text-3xl font-black text-white tracking-widest">
        RMMONEY ₹
      </h1>
      <p className="text-white/80 text-sm mt-1">EARN REAL MONEY EVERY DAY</p>
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-8"
      style={{
        background:
          "linear-gradient(135deg, #ff6b35 0%, #f7c948 50%, #ff4d6d 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        <Logo />

        {/* WELCOME SCREEN */}
        {mode === "select" && (
          <div className="bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="font-black text-xl text-center tracking-widest text-gray-800">
              WELCOME TO RMMONEY!
            </h2>
            <p className="text-center text-gray-500 text-sm">
              CHOOSE AN OPTION TO CONTINUE
            </p>
            <Button
              data-ocid="auth.register_button"
              onClick={() => setMode("register")}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black tracking-widest text-lg py-6"
            >
              NEW REGISTRATION
            </Button>
            <Button
              data-ocid="auth.login_button"
              onClick={() => setMode("login")}
              variant="outline"
              className="w-full border-2 border-orange-500 text-orange-600 font-black tracking-widest text-lg py-6"
            >
              LOGIN
            </Button>
          </div>
        )}

        {/* LOGIN SCREEN */}
        {mode === "login" && (
          <div className="bg-white rounded-2xl p-6 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                data-ocid="login.back_button"
                onClick={() => setMode("select")}
                className="text-orange-500 font-bold text-xl"
              >
                ←
              </button>
              <h2 className="font-black text-lg tracking-widest text-gray-800">
                LOGIN
              </h2>
            </div>

            <Input
              data-ocid="login.phone.input"
              placeholder="MOBILE NUMBER (10 DIGITS)"
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ""))}
              maxLength={10}
              type="tel"
              className="text-sm font-bold tracking-wider"
            />

            <Input
              data-ocid="login.password.input"
              placeholder="PASSWORD"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              type="password"
              className="text-sm font-bold tracking-wider"
            />

            <Button
              data-ocid="login.submit_button"
              onClick={handleLogin}
              disabled={loginBusy}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black tracking-widest py-5"
            >
              {loginBusy ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : null}
              LOGIN
            </Button>

            <p className="text-center text-sm text-gray-500 pt-1">
              NEW USER?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-orange-500 font-bold underline"
              >
                REGISTER HERE
              </button>
            </p>
          </div>
        )}

        {/* REGISTRATION SCREEN */}
        {mode === "register" && (
          <div className="bg-white rounded-2xl p-6 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                data-ocid="register.back_button"
                onClick={() => setMode("select")}
                className="text-orange-500 font-bold text-xl"
              >
                ←
              </button>
              <h2 className="font-black text-lg tracking-widest text-gray-800">
                NEW REGISTRATION
              </h2>
            </div>

            <Input
              data-ocid="register.name.input"
              placeholder="YOUR FULL NAME"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              className="font-bold uppercase tracking-wider"
            />

            <Input
              data-ocid="register.phone.input"
              placeholder="MOBILE NUMBER (10 DIGITS)"
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ""))}
              maxLength={10}
              type="tel"
              className="text-sm font-bold tracking-wider"
            />

            <Input
              data-ocid="register.password.input"
              placeholder="CREATE PASSWORD (MIN 4 CHARACTERS)"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              type="password"
              className="text-sm font-bold tracking-wider"
            />

            <Input
              data-ocid="register.ref.input"
              placeholder="REFERRAL CODE (OPTIONAL)"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value.toUpperCase())}
              className="font-bold tracking-wider"
            />

            <Button
              data-ocid="register.submit_button"
              onClick={handleRegister}
              disabled={regBusy}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black tracking-widest py-5"
            >
              {regBusy ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : null}
              REGISTER
            </Button>

            <p className="text-center text-sm text-gray-500 pt-1">
              ALREADY REGISTERED?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-orange-500 font-bold underline"
              >
                LOGIN HERE
              </button>
            </p>
          </div>
        )}

        <p className="text-center text-white/60 text-xs mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// HOME TAB
// ──────────────────────────────────────────────────────────────
function HomeTab({
  user,
  completions,
  tasks,
}: { user: RMUser; completions: RMTaskCompletion[]; tasks: RMTask[] }) {
  const confirmedCount = completions.filter(
    (c) => c.status === "confirmed",
  ).length;
  const pendingCount = completions.filter((c) => c.status === "pending").length;
  const balanceRs = (Number(user.coinBalance) / 100).toFixed(2);
  const refBalanceRs = (Number(user.referralCoinBalance) / 100).toFixed(2);
  const withdrawalsLeft = 5 - Number(user.taskWithdrawalsToday);

  return (
    <div className="p-4 space-y-4" data-ocid="home.section">
      {/* Balance Card */}
      <div
        className="rounded-2xl p-5 text-white shadow-xl"
        style={{ background: "linear-gradient(135deg, #ff6b35, #f7c948)" }}
      >
        <p className="text-xs font-bold opacity-80 tracking-widest">
          TOTAL BALANCE
        </p>
        <p className="text-4xl font-black mt-1">₹{balanceRs}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-yellow-200 font-semibold">
            🪙 {Number(user.coinBalance)} COINS
          </span>
          <span className="text-white/60 text-sm">(100 COINS = ₹1)</span>
        </div>
        <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-sm">
          <div>
            <p className="opacity-70 text-xs">REFERRAL EARNINGS</p>
            <p className="font-bold">₹{refBalanceRs}</p>
          </div>
          <div className="text-right">
            <p className="opacity-70 text-xs">WITHDRAWALS LEFT TODAY</p>
            <p className="font-bold">{withdrawalsLeft}/5</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-black text-orange-500">{tasks.length}</p>
          <p className="text-[10px] font-bold text-gray-500 tracking-wider mt-1">
            TOTAL TASKS
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-black text-green-500">{confirmedCount}</p>
          <p className="text-[10px] font-bold text-gray-500 tracking-wider mt-1">
            COMPLETED
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-black text-yellow-500">{pendingCount}</p>
          <p className="text-[10px] font-bold text-gray-500 tracking-wider mt-1">
            PENDING
          </p>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-orange-300">
            <AvatarImage src={user.profilePhotoUrl} />
            <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold tracking-wider text-sm">
              {user.name.toUpperCase()}
            </p>
            <p className="text-xs text-gray-500">{user.userId}</p>
            <p className="text-xs text-orange-500 font-semibold">
              REF: {user.referralCode}
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-black text-sm tracking-widest mb-3">
          HOW IT WORKS
        </h3>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex gap-2">
            <span className="text-orange-500 font-bold">1.</span>
            <span>COMPLETE TASKS & EARN COINS</span>
          </div>
          <div className="flex gap-2">
            <span className="text-orange-500 font-bold">2.</span>
            <span>
              REFER FRIENDS — WHEN YOUR FRIEND COMPLETES 1 TASK, YOU GET 500
              COINS (₹5)
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-orange-500 font-bold">3.</span>
            <span>WAIT FOR ADMIN APPROVAL</span>
          </div>
          <div className="flex gap-2">
            <span className="text-orange-500 font-bold">4.</span>
            <span>YOUR FRIEND ALSO GETS 200 COINS (₹2) BONUS</span>
          </div>
          <div className="flex gap-2">
            <span className="text-orange-500 font-bold">5.</span>
            <span>100 COINS = ₹1</span>
          </div>
          <div className="flex gap-2">
            <span className="text-orange-500 font-bold">6.</span>
            <span>MINIMUM WITHDRAWAL ₹10, MAXIMUM ₹250</span>
          </div>
          <div className="flex gap-2">
            <span className="text-orange-500 font-bold">7.</span>
            <span>MAXIMUM 5 WITHDRAWALS PER DAY ONLY</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// TASKS TAB
// ──────────────────────────────────────────────────────────────
function TasksTab({
  user,
  tasks,
  completions,
  actor,
  actorRef,
  onRefresh,
}: {
  user: RMUser;
  tasks: RMTask[];
  completions: RMTaskCompletion[];
  actor: any;
  actorRef: React.RefObject<any>;
  onRefresh: () => void;
}) {
  const [submitting, setSubmitting] = useState<string | null>(null);

  const getCompletion = (taskId: string) =>
    completions.find((c) => c.taskId === taskId);

  const handleSubmit = async (task: RMTask) => {
    const a = actorRef.current || actor;
    if (!a) return;
    const existing = getCompletion(task.id);
    if (existing) {
      toast.info("ALREADY SUBMITTED FOR THIS TASK");
      return;
    }
    setSubmitting(task.id);
    try {
      await a.submitCompletion({
        id: generateId(),
        userId: user.id,
        taskId: task.id,
        status: "pending",
        submittedAt: BigInt(Date.now()),
        confirmedAt: BigInt(0),
      });
      toast.success("TASK SUBMITTED! WAITING FOR ADMIN APPROVAL.");
      onRefresh();
    } catch {
      toast.error("SUBMISSION FAILED. TRY AGAIN.");
    } finally {
      setSubmitting(null);
    }
  };

  const sorted = [...tasks].sort(
    (a, b) => Number(a.sequence) - Number(b.sequence),
  );

  if (sorted.length === 0) {
    return (
      <div className="p-6 text-center" data-ocid="tasks.empty_state">
        <div className="text-6xl mb-4">📋</div>
        <p className="font-bold text-gray-500 tracking-widest">
          NO TASKS AVAILABLE YET
        </p>
        <p className="text-sm text-gray-400 mt-2">ADMIN WILL ADD TASKS SOON</p>
      </div>
    );
  }

  return (
    <div className="p-4" data-ocid="tasks.list">
      <h2 className="font-black text-sm tracking-widest mb-4">
        AVAILABLE TASKS
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {sorted.map((task, idx) => {
          const completion = getCompletion(task.id);
          const isConfirmed = completion?.status === "confirmed";
          const isPending = completion?.status === "pending";
          const coinsRs = (Number(task.coinsReward) / 100).toFixed(2);

          return (
            <div
              key={task.id}
              data-ocid={`tasks.item.${idx + 1}`}
              className="flex-shrink-0 w-72 bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100"
            >
              {/* Sequence badge */}
              <div className="relative">
                {task.imageUrl ? (
                  <img
                    src={task.imageUrl}
                    alt={task.title}
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-36 flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #ff6b35, #f7c948)",
                    }}
                  >
                    <span className="text-5xl font-black text-white opacity-40">
                      {idx + 1}
                    </span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black text-yellow-400 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
                  {idx + 1}
                </div>
                {isConfirmed && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle size={12} /> VERIFIED
                  </div>
                )}
                {isPending && !isConfirmed && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                    PENDING
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-black text-sm tracking-wide">
                  {task.title.toUpperCase()}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {task.description}
                </p>
                {task.rules && (
                  <p className="text-xs text-orange-600 mt-2 font-semibold">
                    {task.rules}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1">
                    <span className="text-xs font-black text-yellow-700">
                      🪙 {Number(task.coinsReward)} = ₹{coinsRs}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  {task.url && (
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center text-xs font-bold text-white rounded-lg py-2 px-3"
                      style={{
                        background: "linear-gradient(90deg, #ff6b35, #f7c948)",
                      }}
                    >
                      OPEN TASK
                    </a>
                  )}
                  {!isConfirmed && !isPending && (
                    <button
                      type="button"
                      data-ocid={`tasks.submit_button.${idx + 1}`}
                      onClick={() => handleSubmit(task)}
                      disabled={!!submitting}
                      className="flex-1 text-xs font-bold border-2 border-orange-400 text-orange-600 rounded-lg py-2 px-3 hover:bg-orange-50 disabled:opacity-50"
                    >
                      {submitting === task.id ? (
                        <Loader2 className="animate-spin mx-auto" size={14} />
                      ) : (
                        "SUBMIT"
                      )}
                    </button>
                  )}
                  {isConfirmed && (
                    <div className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-green-600">
                      <CheckCircle size={14} /> ADMIN VERIFIED ✓
                    </div>
                  )}
                  {isPending && !isConfirmed && (
                    <div className="flex-1 flex items-center justify-center text-xs font-bold text-yellow-600">
                      ⏳ AWAITING ADMIN
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// WALLET TAB
// ──────────────────────────────────────────────────────────────
function WalletTab({
  user,
  actor,
  actorRef,
  onRefresh,
}: {
  user: RMUser;
  actor: any;
  actorRef: React.RefObject<any>;
  onRefresh: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [withdrawType, setWithdrawType] = useState<"task" | "referral">("task");
  const [busy, setBusy] = useState(false);
  const [withdrawals, setWithdrawals] = useState<RMWithdrawalRequest[]>([]);

  useEffect(() => {
    const a = actorRef.current || actor;
    if (!a) return;
    a.getWithdrawalsByUser(user.id)
      .then(setWithdrawals)
      .catch(() => {});
  }, [user.id, actor, actorRef]);

  const balanceRs = Number(user.coinBalance) / 100;
  const refBalanceRs = Number(user.referralCoinBalance) / 100;
  const withdrawalsLeft = Math.max(0, 5 - Number(user.taskWithdrawalsToday));
  const today = todayStr();
  const isNewDay = user.lastWithdrawalDate !== today;
  const effectiveLeft = isNewDay ? 5 : withdrawalsLeft;

  const handleWithdraw = async () => {
    const a = actorRef.current || actor;
    if (!a) return;
    const amtNum = Number.parseFloat(amount);
    if (Number.isNaN(amtNum) || amtNum < 10) {
      toast.error("MINIMUM WITHDRAWAL ₹10");
      return;
    }
    if (amtNum > 250) {
      toast.error("MAXIMUM WITHDRAWAL ₹250");
      return;
    }
    if (!user.upiId) {
      toast.error("SET YOUR UPI ID IN PROFILE FIRST");
      return;
    }
    if (effectiveLeft <= 0) {
      toast.error("DAILY WITHDRAWAL LIMIT REACHED (5/DAY)");
      return;
    }
    const sourceBalance = withdrawType === "task" ? balanceRs : refBalanceRs;
    if (amtNum > sourceBalance) {
      toast.error("INSUFFICIENT BALANCE");
      return;
    }
    setBusy(true);
    try {
      const coins = BigInt(Math.round(amtNum * 100));
      await a.requestWithdrawal({
        id: generateId(),
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        userUpiId: user.upiId,
        coins,
        amountRs: BigInt(Math.round(amtNum)),
        withdrawalType: withdrawType,
        status: "pending",
        requestedAt: BigInt(Date.now()),
        processedAt: BigInt(0),
      });
      const updatedUser: RMUser = {
        ...user,
        taskWithdrawalsToday: isNewDay
          ? BigInt(1)
          : BigInt(Number(user.taskWithdrawalsToday) + 1),
        lastWithdrawalDate: today,
        coinBalance:
          withdrawType === "task"
            ? BigInt(Number(user.coinBalance) - Number(coins))
            : user.coinBalance,
        referralCoinBalance:
          withdrawType === "referral"
            ? BigInt(Number(user.referralCoinBalance) - Number(coins))
            : user.referralCoinBalance,
      };
      await a.updateUser(updatedUser);
      setAmount("");
      toast.success("WITHDRAWAL REQUEST SENT TO ADMIN!");
      onRefresh();
    } catch {
      toast.error("WITHDRAWAL FAILED. TRY AGAIN.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-4" data-ocid="wallet.section">
      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4 text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, #ff6b35, #f7c948)" }}
        >
          <p className="text-[10px] font-bold opacity-80">TASK BALANCE</p>
          <p className="text-2xl font-black mt-1">₹{balanceRs.toFixed(2)}</p>
          <p className="text-xs opacity-70">🪙 {Number(user.coinBalance)}</p>
        </div>
        <div
          className="rounded-xl p-4 text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
        >
          <p className="text-[10px] font-bold opacity-80">REFERRAL BALANCE</p>
          <p className="text-2xl font-black mt-1">₹{refBalanceRs.toFixed(2)}</p>
          <p className="text-xs opacity-70">
            🪙 {Number(user.referralCoinBalance)}
          </p>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-black text-sm tracking-widest mb-3">
          WITHDRAW MONEY
        </h3>
        <div className="mb-3 p-2 bg-orange-50 rounded-lg">
          <p className="text-xs font-bold text-orange-700">
            WITHDRAWALS REMAINING TODAY: {effectiveLeft}/5
          </p>
        </div>

        {!user.upiId && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <AlertCircle
              size={16}
              className="text-red-500 flex-shrink-0 mt-0.5"
            />
            <p className="text-xs text-red-600 font-semibold">
              SET UPI ID IN PROFILE TAB BEFORE WITHDRAWING
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="wallet.task.tab"
              onClick={() => setWithdrawType("task")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-colors ${
                withdrawType === "task"
                  ? "bg-orange-500 text-white border-orange-500"
                  : "border-orange-300 text-orange-600"
              }`}
            >
              TASK EARNINGS
            </button>
            <button
              type="button"
              data-ocid="wallet.referral.tab"
              onClick={() => setWithdrawType("referral")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-colors ${
                withdrawType === "referral"
                  ? "bg-purple-500 text-white border-purple-500"
                  : "border-purple-300 text-purple-600"
              }`}
            >
              REFERRAL EARNINGS
            </button>
          </div>

          <Input
            data-ocid="wallet.input"
            type="number"
            placeholder="AMOUNT IN ₹ (MIN ₹10, MAX ₹250)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="10"
            max="250"
          />

          <Button
            data-ocid="wallet.submit_button"
            onClick={handleWithdraw}
            disabled={busy || !user.upiId || effectiveLeft <= 0}
            className="w-full font-bold tracking-widest bg-orange-500 hover:bg-orange-600 text-white"
          >
            {busy ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "REQUEST WITHDRAWAL"
            )}
          </Button>
        </div>
      </div>

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-black text-xs tracking-widest mb-3">
            WITHDRAWAL HISTORY
          </h3>
          <div className="space-y-2">
            {withdrawals.slice(0, 10).map((w, i) => (
              <div
                key={w.id}
                data-ocid={`wallet.item.${i + 1}`}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-xs font-bold">₹{Number(w.amountRs)}</p>
                  <p className="text-[10px] text-gray-500">
                    {w.withdrawalType.toUpperCase()}
                  </p>
                </div>
                <Badge
                  variant={
                    w.status === "approved"
                      ? "default"
                      : w.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-[10px]"
                >
                  {w.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// REFER TAB
// ──────────────────────────────────────────────────────────────
function ReferTab({ user, allUsers }: { user: RMUser; allUsers: RMUser[] }) {
  const referralLink = `${window.location.origin}?ref=${user.referralCode}`;
  const referredUsers = allUsers.filter((u) => u.referredBy === user.id);

  const copyLink = () => {
    navigator.clipboard
      .writeText(referralLink)
      .then(() => toast.success("LINK COPIED!"))
      .catch(() => toast.error("COPY FAILED"));
  };

  return (
    <div className="p-4 space-y-4" data-ocid="refer.section">
      {/* Earnings highlight */}
      <div
        className="rounded-xl p-4 text-white text-center shadow-xl"
        style={{ background: "linear-gradient(135deg, #f7c948, #ff6b35)" }}
      >
        <p className="text-2xl font-black">🔥 EARN ₹7500 PER DAY! HURRY! 🔥</p>
        <p className="text-sm mt-1 opacity-90">
          REFER FRIENDS & EARN 500 COINS PER TASK COMPLETED
        </p>
      </div>

      {/* Referral Code */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-500 tracking-widest mb-2">
          YOUR REFERRAL CODE
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-orange-50 border-2 border-orange-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-orange-600 tracking-[0.3em]">
              {user.referralCode}
            </p>
          </div>
          <button
            type="button"
            data-ocid="refer.copy.button"
            onClick={copyLink}
            className="p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
          >
            <Copy size={20} />
          </button>
        </div>
      </div>

      {/* Share Link */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-500 tracking-widest mb-3">
          SHARE YOUR REFERRAL LINK
        </p>
        <div className="grid grid-cols-5 gap-2">
          {SOCIAL.map((s) => (
            <a
              key={s.name}
              href={s.getUrl(referralLink)}
              target="_blank"
              rel="noreferrer"
              data-ocid={`refer.${s.name.toLowerCase()}.button`}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md"
                style={{ background: s.bg }}
              >
                {s.icon}
              </div>
              <span className="text-[9px] font-bold text-gray-600">
                {s.name}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-black text-xs tracking-widest mb-3">
          YOUR REFERRAL LIST ({referredUsers.length})
        </h3>
        {referredUsers.length === 0 ? (
          <div data-ocid="refer.empty_state" className="text-center py-4">
            <p className="text-gray-400 text-sm">NO REFERRALS YET</p>
            <p className="text-xs text-gray-400 mt-1">
              SHARE YOUR CODE TO START EARNING!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {referredUsers.map((ru, i) => {
              const status = ru.hasCompletedFirstTask
                ? "BONUS EARNED"
                : "JOINED";
              return (
                <div
                  key={ru.id}
                  data-ocid={`refer.item.${i + 1}`}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-xs font-bold">{ru.name.toUpperCase()}</p>
                    <p className="text-[10px] text-gray-500">{ru.userId}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        ru.hasCompletedFirstTask ? "default" : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {status}
                    </Badge>
                    {ru.hasCompletedFirstTask && (
                      <p className="text-[10px] text-green-600 font-bold mt-1">
                        +₹5 EARNED
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PROFILE TAB
// ──────────────────────────────────────────────────────────────
function ProfileTab({
  user,
  actor,
  actorRef,
  onRefresh,
}: {
  user: RMUser;
  actor: any;
  actorRef: React.RefObject<any>;
  onRefresh: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [upiId, setUpiId] = useState(user.upiId);
  const [busy, setBusy] = useState(false);
  const { upload, uploading } = useUpload();

  const handleSave = async () => {
    const a = actorRef.current || actor;
    if (!a) return;
    if (!isValidUpi(upiId) && upiId.trim() !== "") {
      toast.error("INVALID UPI ID FORMAT (e.g. 9876543210@paytm)");
      return;
    }
    if (user.upiLocked && upiId !== user.upiId) {
      toast.error("UPI ID CANNOT BE CHANGED ONCE SET");
      return;
    }
    setBusy(true);
    try {
      const updated: RMUser = {
        ...user,
        name: name.trim() || user.name,
        upiId: upiId.trim(),
        upiLocked: upiId.trim() !== "" ? true : user.upiLocked,
      };
      await a.updateUser(updated);
      toast.success("PROFILE UPDATED!");
      onRefresh();
    } catch {
      toast.error("UPDATE FAILED. TRY AGAIN.");
    } finally {
      setBusy(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = actorRef.current || actor;
    if (!a || !e.target.files?.[0]) return;
    try {
      const url = await upload(e.target.files[0]);
      await a.updateUser({ ...user, profilePhotoUrl: url });
      toast.success("PHOTO UPDATED!");
      onRefresh();
    } catch {
      toast.error("PHOTO UPLOAD FAILED");
    }
  };

  return (
    <div className="p-4 space-y-4" data-ocid="profile.section">
      {/* Photo */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-orange-300">
            <AvatarImage src={user.profilePhotoUrl} />
            <AvatarFallback className="bg-orange-100 text-orange-600 font-black text-2xl">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <label
            htmlFor="profile-photo-input"
            className="absolute bottom-0 right-0 bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600"
          >
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={14} />
            )}
            <input
              data-ocid="profile.upload_button"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
          </label>
        </div>
        <div className="text-center">
          <p className="font-black text-sm tracking-wider">
            {user.name.toUpperCase()}
          </p>
          <p className="text-xs text-gray-500">{user.userId}</p>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="font-black text-xs tracking-widest">EDIT PROFILE</h3>
        <div>
          <p className="text-[10px] font-bold text-gray-500 tracking-widest">
            FULL NAME
          </p>
          <Input
            data-ocid="profile.name.input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 uppercase"
            placeholder="YOUR NAME"
          />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-500 tracking-widest">
            UPI ID{" "}
            {user.upiLocked && (
              <span className="text-red-500">(PERMANENT - CANNOT CHANGE)</span>
            )}
          </p>
          <Input
            data-ocid="profile.upi.input"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="9876543210@paytm"
            disabled={user.upiLocked}
            className="mt-1"
          />
          {!user.upiLocked && (
            <p className="text-[10px] text-orange-500 mt-1 font-semibold">
              ⚠️ ONCE SET, UPI ID CANNOT BE CHANGED
            </p>
          )}
        </div>
        <Button
          data-ocid="profile.save_button"
          onClick={handleSave}
          disabled={busy}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold tracking-widest"
        >
          {busy ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            "SAVE CHANGES"
          )}
        </Button>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-black text-xs tracking-widest mb-3">
          ACCOUNT INFO
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">USER ID</span>
            <span className="font-bold">{user.userId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">PHONE</span>
            <span className="font-bold">{user.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">REFERRAL CODE</span>
            <span className="font-bold text-orange-500">
              {user.referralCode}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
