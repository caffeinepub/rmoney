import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Clock,
  CreditCard,
  Edit,
  Image,
  LayoutDashboard,
  ListTodo,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  RMAdminWallet,
  RMTask,
  RMTaskCompletion,
  RMUser,
  RMWithdrawalRequest,
} from "../backend.d";
import { useUpload } from "../blob-storage/hooks";
import { useActor } from "../hooks/useActor";
import { generateId, getAdminSession, setAdminSession } from "../utils/storage";

const ADMIN_PHONE = "9053405019";
const ADMIN_PASS = "Rakhi5050";

type AdminTab = "dashboard" | "tasks" | "users" | "withdrawals" | "wallet";

export default function AdminPortal() {
  const [logged, setLogged] = useState(getAdminSession);
  if (!logged)
    return (
      <AdminLogin
        onLogin={() => {
          setAdminSession(true);
          setLogged(true);
        }}
      />
    );
  return (
    <AdminApp
      onLogout={() => {
        setAdminSession(false);
        setLogged(false);
      }}
    />
  );
}

// ──────────────────────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const handleLogin = () => {
    if (phone === ADMIN_PHONE && pass === ADMIN_PASS) {
      onLogin();
    } else {
      setErr("INVALID CREDENTIALS");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 border-4 border-orange-300">
            <img
              src="/assets/uploads/WhatsApp-Image-2026-03-14-at-6.32.40-AM-1-1.jpeg"
              alt="RM"
              className="w-full h-full object-cover scale-[2.2]"
            />
          </div>
          <h1 className="text-2xl font-black tracking-widest">RMMONEY ₹</h1>
          <p className="text-sm text-gray-500 mt-1">ADMIN PORTAL</p>
        </div>
        <div className="space-y-4">
          <Input
            data-ocid="admin.phone.input"
            placeholder="MOBILE NUMBER"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            data-ocid="admin.pass.input"
            type="password"
            placeholder="PASSWORD"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {err && (
            <p
              data-ocid="admin.login.error_state"
              className="text-xs text-red-500 font-semibold text-center"
            >
              {err}
            </p>
          )}
          <Button
            data-ocid="admin.login.primary_button"
            onClick={handleLogin}
            className="w-full bg-black text-white hover:bg-gray-800 font-bold tracking-widest"
          >
            LOGIN
          </Button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN APP
// ──────────────────────────────────────────────────────────────
function AdminApp({ onLogout }: { onLogout: () => void }) {
  const { actor } = useActor();
  const actorRef = useRef<any>(null);
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [tasks, setTasks] = useState<RMTask[]>([]);
  const [users, setUsers] = useState<RMUser[]>([]);
  const [completions, setCompletions] = useState<RMTaskCompletion[]>([]);
  const [withdrawals, setWithdrawals] = useState<RMWithdrawalRequest[]>([]);
  const [wallet, setWallet] = useState<RMAdminWallet | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (actor) actorRef.current = actor;
  }, [actor]);

  const refresh = async () => {
    const a = actorRef.current || actor;
    if (!a) return;
    try {
      const [t, u, c, w, wl] = await Promise.all([
        a.getTasks(),
        a.getAllUsers(),
        a.getAllPendingCompletions(),
        a.getAllPendingWithdrawals(),
        a.getAdminWallet(),
      ]);
      setTasks(t);
      setUsers(u);
      setCompletions(c);
      setWithdrawals(w);
      setWallet(wl);
    } catch (e) {
      console.error("Refresh error", e);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: polling interval intentional
  useEffect(() => {
    if (!actor) return;
    actorRef.current = actor;
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [actor]);

  const manualRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    toast.success("REFRESHED");
  };

  const navItems: {
    id: AdminTab;
    icon: React.FC<{ size?: number }>;
    label: string;
    badge?: number;
  }[] = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "DASHBOARD",
      badge: completions.length,
    },
    { id: "tasks", icon: ListTodo, label: "TASKS" },
    { id: "users", icon: Users, label: "USERS" },
    {
      id: "withdrawals",
      icon: CreditCard,
      label: "WITHDRAWALS",
      badge: withdrawals.length,
    },
    { id: "wallet", icon: Wallet, label: "WALLET" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 min-h-screen">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-300">
              <img
                src="/assets/uploads/WhatsApp-Image-2026-03-14-at-6.32.40-AM-1-1.jpeg"
                alt="RM"
                className="w-full h-full object-cover scale-[2.2]"
              />
            </div>
            <div>
              <p className="font-black text-sm tracking-widest">RMMONEY ₹</p>
              <p className="text-xs text-gray-500">ADMIN</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ id, icon: Icon, label, badge }) => (
            <button
              type="button"
              key={id}
              data-ocid={`admin.${id}.tab`}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                tab === id
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={16} />
              <span className="flex-1 text-left tracking-wider">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full text-sm font-bold"
          >
            <LogOut size={14} className="mr-2" /> LOGOUT
          </Button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-black text-white p-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-yellow-400">
              <img
                src="/assets/uploads/WhatsApp-Image-2026-03-14-at-6.32.40-AM-1-1.jpeg"
                alt="RM"
                className="w-full h-full object-cover scale-[2.2]"
              />
            </div>
            <span className="font-bold text-sm tracking-widest text-yellow-400">
              RMMONEY ADMIN ₹
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={manualRefresh}
              className="p-1 text-gray-400"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="p-1 text-gray-400"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <h1 className="font-black text-lg tracking-widest">
            {navItems.find((n) => n.id === tab)?.label}
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={manualRefresh}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-black"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />{" "}
              REFRESH
            </button>
            <div className="text-sm text-gray-500">AUTO-REFRESH: 3S</div>
            <button
              type="button"
              onClick={onLogout}
              className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1"
            >
              <LogOut size={14} /> LOGOUT
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          {tab === "dashboard" && (
            <DashboardTab
              completions={completions}
              users={users}
              actor={actor}
              actorRef={actorRef}
              onRefresh={refresh}
              tasks={tasks}
            />
          )}
          {tab === "tasks" && (
            <TasksTab
              tasks={tasks}
              actor={actor}
              actorRef={actorRef}
              onRefresh={refresh}
            />
          )}
          {tab === "users" && <UsersTab users={users} />}
          {tab === "withdrawals" && (
            <WithdrawalsTab
              withdrawals={withdrawals}
              users={users}
              actor={actor}
              actorRef={actorRef}
              onRefresh={refresh}
              wallet={wallet}
              setWallet={setWallet}
            />
          )}
          {tab === "wallet" && (
            <WalletTab
              wallet={wallet}
              actor={actor}
              actorRef={actorRef}
              onRefresh={refresh}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40">
        {navItems.map(({ id, icon: Icon, label, badge }) => (
          <button
            type="button"
            key={id}
            data-ocid={`admin.mobile.${id}.tab`}
            onClick={() => setTab(id)}
            className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-colors relative ${
              tab === id ? "text-black" : "text-gray-400"
            }`}
          >
            <Icon size={18} />
            <span className="text-[9px] font-bold tracking-wide">
              {label.split(" ")[0]}
            </span>
            {badge !== undefined && badge > 0 && (
              <span className="absolute top-1 right-1/4 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD TAB
// ──────────────────────────────────────────────────────────────
function DashboardTab({
  completions,
  users,
  actor,
  actorRef,
  onRefresh,
  tasks,
}: {
  completions: RMTaskCompletion[];
  users: RMUser[];
  tasks: RMTask[];
  actor: any;
  actorRef: React.RefObject<any>;
  onRefresh: () => void;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);

  const handleConfirm = async (comp: RMTaskCompletion) => {
    const a = actorRef.current || actor;
    if (!a) return;
    setConfirming(comp.id);
    try {
      const ok = await a.confirmCompletion(comp.id);
      if (ok) {
        // Credit user coins + referral bonus
        const userRes = await a.getUserById(comp.userId);
        if (userRes.length > 0) {
          const u = userRes[0];
          const taskRes = tasks.find((t) => t.id === comp.taskId);
          const reward = taskRes ? taskRes.coinsReward : BigInt(0);
          let newBalance = BigInt(Number(u.coinBalance) + Number(reward));
          let refBalance = u.referralCoinBalance;
          let hasCompleted = u.hasCompletedFirstTask;

          // First task bonus
          if (!u.hasCompletedFirstTask) {
            hasCompleted = true;
            newBalance = BigInt(Number(newBalance) + 200); // friend gets 200 coins
            // Credit referrer
            if (u.referredBy) {
              const refRes = await a.getUserById(u.referredBy);
              if (refRes.length > 0) {
                const referrer = refRes[0];
                await a.updateUser({
                  ...referrer,
                  referralCoinBalance: BigInt(
                    Number(referrer.referralCoinBalance) + 500,
                  ),
                });
              }
            }
          }

          await a.updateUser({
            ...u,
            coinBalance: newBalance,
            referralCoinBalance: refBalance,
            hasCompletedFirstTask: hasCompleted,
          });
        }
        toast.success("TASK CONFIRMED! COINS CREDITED.");
        onRefresh();
      } else {
        toast.error("CONFIRMATION FAILED.");
      }
    } catch {
      toast.error("ERROR CONFIRMING TASK.");
    } finally {
      setConfirming(null);
    }
  };

  const getUserInfo = (userId: string) => users.find((u) => u.id === userId);
  const getTaskName = (taskId: string) =>
    tasks.find((t) => t.id === taskId)?.title || taskId;

  return (
    <div className="p-4 md:p-6 space-y-4" data-ocid="dashboard.section">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="TOTAL USERS" value={users.length} color="blue" />
        <StatCard
          label="PENDING TASKS"
          value={completions.length}
          color="yellow"
        />
        <StatCard label="TOTAL TASKS" value={tasks.length} color="green" />
        <StatCard label="LIVE TRACKING" value="🟢 ON" color="red" isText />
      </div>

      {/* Pending Completions */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-black text-sm tracking-widest">
            PENDING TASK COMPLETIONS ({completions.length})
          </h2>
        </div>
        {completions.length === 0 ? (
          <div
            data-ocid="dashboard.empty_state"
            className="p-8 text-center text-gray-400"
          >
            <CheckCircle className="mx-auto mb-2 opacity-40" size={32} />
            <p className="font-bold text-sm">NO PENDING COMPLETIONS</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {completions.map((comp, i) => {
              const u = getUserInfo(comp.userId);
              return (
                <div
                  key={comp.id}
                  data-ocid={`dashboard.item.${i + 1}`}
                  className="p-4 flex items-center gap-3"
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={u?.profilePhotoUrl} />
                    <AvatarFallback className="bg-orange-100 text-orange-600 font-bold text-sm">
                      {u?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                      {u?.name?.toUpperCase() || "UNKNOWN USER"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {u?.userId} · {getTaskName(comp.taskId).toUpperCase()}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(Number(comp.submittedAt)).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    data-ocid={`dashboard.confirm_button.${i + 1}`}
                    onClick={() => handleConfirm(comp)}
                    disabled={confirming === comp.id}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white font-bold text-xs flex-shrink-0"
                  >
                    {confirming === comp.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle size={14} className="mr-1" /> CONFIRM
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  isText,
}: { label: string; value: number | string; color: string; isText?: boolean }) {
  const colors: Record<string, string> = {
    blue: "text-blue-600",
    yellow: "text-yellow-600",
    green: "text-green-600",
    red: "text-red-600",
  };
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p
        className={`${isText ? "text-lg" : "text-2xl"} font-black ${colors[color] || "text-gray-800"}`}
      >
        {value}
      </p>
      <p className="text-[10px] font-bold text-gray-500 tracking-wider mt-1">
        {label}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// TASKS TAB
// ──────────────────────────────────────────────────────────────
function TasksTab({
  tasks,
  actor,
  actorRef,
  onRefresh,
}: {
  tasks: RMTask[];
  actor: any;
  actorRef: React.RefObject<any>;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RMTask | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    rules: "",
    url: "",
    coinsReward: "",
    sequence: "",
    imageUrl: "",
    active: true,
  });
  const [busy, setBusy] = useState(false);
  const { upload, uploading } = useUpload();

  const openAdd = () => {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      rules: "",
      url: "",
      coinsReward: "",
      sequence: String(tasks.length + 1),
      imageUrl: "",
      active: true,
    });
    setOpen(true);
  };

  const openEdit = (task: RMTask) => {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description,
      rules: task.rules,
      url: task.url,
      coinsReward: String(Number(task.coinsReward)),
      sequence: String(Number(task.sequence)),
      imageUrl: task.imageUrl,
      active: task.active,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const a = actorRef.current || actor;
    if (!a) return;
    if (!form.title.trim()) {
      toast.error("ENTER TASK TITLE");
      return;
    }
    setBusy(true);
    try {
      const task: RMTask = {
        id: editing?.id || generateId(),
        sequence: BigInt(Number.parseInt(form.sequence) || 1),
        title: form.title.trim(),
        description: form.description.trim(),
        rules: form.rules.trim(),
        url: form.url.trim(),
        imageUrl: form.imageUrl,
        coinsReward: BigInt(Number.parseInt(form.coinsReward) || 0),
        active: form.active,
      };
      if (editing) {
        await a.updateTask(task);
        toast.success("TASK UPDATED!");
      } else {
        await a.addTask(task);
        toast.success("TASK ADDED!");
      }
      setOpen(false);
      onRefresh();
    } catch {
      toast.error("SAVE FAILED.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    const a = actorRef.current || actor;
    if (!a) return;
    try {
      await a.deleteTask(id);
      toast.success("TASK DELETED.");
      onRefresh();
    } catch {
      toast.error("DELETE FAILED.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try {
      const url = await upload(e.target.files[0]);
      setForm((f) => ({ ...f, imageUrl: url }));
      toast.success("IMAGE UPLOADED!");
    } catch {
      toast.error("IMAGE UPLOAD FAILED");
    }
  };

  const sorted = [...tasks].sort(
    (a, b) => Number(a.sequence) - Number(b.sequence),
  );

  return (
    <div className="p-4 md:p-6 space-y-4" data-ocid="tasks.section">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-sm tracking-widest">
          TASK MANAGEMENT ({tasks.length})
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="tasks.open_modal_button"
              onClick={openAdd}
              size="sm"
              className="bg-black text-white hover:bg-gray-800 font-bold"
            >
              <Plus size={14} className="mr-1" /> ADD TASK
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-black tracking-widest">
                {editing ? "EDIT TASK" : "ADD NEW TASK"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <Input
                data-ocid="tasks.title.input"
                placeholder="TASK TITLE"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
              <Textarea
                data-ocid="tasks.desc.textarea"
                placeholder="DESCRIPTION"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
              />
              <Textarea
                placeholder="RULES (OPTIONAL)"
                value={form.rules}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rules: e.target.value }))
                }
                rows={2}
              />
              <Input
                placeholder="URL / LINK"
                value={form.url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, url: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  data-ocid="tasks.coins.input"
                  type="number"
                  placeholder="COINS REWARD"
                  value={form.coinsReward}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, coinsReward: e.target.value }))
                  }
                />
                <Input
                  type="number"
                  placeholder="SEQUENCE #"
                  value={form.sequence}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sequence: e.target.value }))
                  }
                />
              </div>

              {/* Image Upload */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-3">
                <p className="text-xs font-bold text-gray-500 mb-2">
                  TASK IMAGE (OPTIONAL)
                </p>
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="task"
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                )}
                <label
                  htmlFor="task-image-input"
                  className="flex items-center gap-2 cursor-pointer text-sm text-orange-600 font-bold hover:text-orange-700"
                >
                  {uploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Image size={16} />
                  )}
                  <span>{uploading ? "UPLOADING..." : "UPLOAD PHOTO"}</span>
                  <input
                    data-ocid="tasks.upload_button"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  data-ocid="tasks.save_button"
                  onClick={handleSave}
                  disabled={busy}
                  className="flex-1 bg-black text-white hover:bg-gray-800 font-bold"
                >
                  {busy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : editing ? (
                    "UPDATE TASK"
                  ) : (
                    "ADD TASK"
                  )}
                </Button>
                <Button
                  data-ocid="tasks.cancel_button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1 font-bold"
                >
                  CANCEL
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sorted.length === 0 ? (
        <div
          data-ocid="tasks.empty_state"
          className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm"
        >
          <ListTodo className="mx-auto mb-2 opacity-40" size={32} />
          <p className="font-bold text-sm">NO TASKS YET</p>
          <p className="text-xs mt-1">ADD YOUR FIRST TASK ABOVE</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((task, i) => (
            <div
              key={task.id}
              data-ocid={`tasks.item.${i + 1}`}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="flex items-start gap-3 p-4">
                {task.imageUrl && (
                  <img
                    src={task.imageUrl}
                    alt={task.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-black text-yellow-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">
                      {Number(task.sequence)}
                    </span>
                    <p className="font-black text-sm truncate">
                      {task.title.toUpperCase()}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      🪙 {Number(task.coinsReward)} COINS = ₹
                      {(Number(task.coinsReward) / 100).toFixed(2)}
                    </Badge>
                    <Badge
                      variant={task.active ? "default" : "outline"}
                      className="text-xs"
                    >
                      {task.active ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Button
                    data-ocid={`tasks.edit_button.${i + 1}`}
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(task)}
                    className="font-bold text-xs"
                  >
                    <Edit size={12} className="mr-1" /> EDIT
                  </Button>
                  <Button
                    data-ocid={`tasks.delete_button.${i + 1}`}
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(task.id)}
                    className="font-bold text-xs"
                  >
                    <Trash2 size={12} className="mr-1" /> DEL
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// USERS TAB
// ──────────────────────────────────────────────────────────────
function UsersTab({ users }: { users: RMUser[] }) {
  return (
    <div className="p-4 md:p-6" data-ocid="users.section">
      <h2 className="font-black text-sm tracking-widest mb-4">
        ALL USERS ({users.length}){" "}
        <span className="text-xs text-green-500 font-normal">🟢 LIVE</span>
      </h2>
      {users.length === 0 ? (
        <div
          data-ocid="users.empty_state"
          className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm"
        >
          <Users className="mx-auto mb-2 opacity-40" size={32} />
          <p className="font-bold text-sm">NO USERS YET</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u, i) => (
            <div
              key={u.id}
              data-ocid={`users.item.${i + 1}`}
              className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3"
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={u.profilePhotoUrl} />
                <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                  {u.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">
                  {u.name.toUpperCase()}
                </p>
                <p className="text-xs text-gray-500">
                  {u.userId} · {u.phone}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-orange-600">
                  🪙 {Number(u.coinBalance)}
                </p>
                <p className="text-[10px] text-gray-400">
                  {new Date(Number(u.createdAt)).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// WITHDRAWALS TAB
// ──────────────────────────────────────────────────────────────
function WithdrawalsTab({
  withdrawals,
  users,
  actor,
  actorRef,
  onRefresh,
  wallet,
  setWallet: _setWallet,
}: {
  withdrawals: RMWithdrawalRequest[];
  users: RMUser[];
  actor: any;
  actorRef: React.RefObject<any>;
  onRefresh: () => void;
  wallet: RMAdminWallet | null;
  setWallet: (w: RMAdminWallet) => void;
}) {
  const [processing, setProcessing] = useState<string | null>(null);

  const getUserInfo = (userId: string) => users.find((u) => u.id === userId);

  const handleApprove = async (w: RMWithdrawalRequest) => {
    const a = actorRef.current || actor;
    if (!a) return;
    if (!wallet) {
      toast.error("WALLET NOT LOADED");
      return;
    }
    if (Number(wallet.balance) < Number(w.amountRs)) {
      toast.error("INSUFFICIENT ADMIN WALLET BALANCE");
      return;
    }
    setProcessing(w.id);
    try {
      await a.approveWithdrawal(w.id);
      await a.updateAdminWallet({
        ...wallet,
        balance: BigInt(Number(wallet.balance) - Number(w.amountRs)),
      });
      toast.success(
        `₹${Number(w.amountRs)} APPROVED! SEND TO UPI: ${w.userUpiId}`,
      );
      onRefresh();
    } catch {
      toast.error("APPROVAL FAILED.");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    const a = actorRef.current || actor;
    if (!a) return;
    setProcessing(id);
    try {
      await a.rejectWithdrawal(id);
      // Refund user coins
      const wReq = withdrawals.find((w) => w.id === id);
      if (wReq) {
        const userRes = await a.getUserById(wReq.userId);
        if (userRes.length > 0) {
          const u = userRes[0];
          if (wReq.withdrawalType === "referral") {
            await a.updateUser({
              ...u,
              referralCoinBalance: BigInt(
                Number(u.referralCoinBalance) + Number(wReq.coins),
              ),
            });
          } else {
            await a.updateUser({
              ...u,
              coinBalance: BigInt(Number(u.coinBalance) + Number(wReq.coins)),
            });
          }
        }
      }
      toast.success("WITHDRAWAL REJECTED. COINS REFUNDED.");
      onRefresh();
    } catch {
      toast.error("REJECTION FAILED.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4" data-ocid="withdrawals.section">
      <h2 className="font-black text-sm tracking-widest">
        PENDING WITHDRAWALS ({withdrawals.length})
      </h2>

      {wallet && (
        <div className="bg-black text-yellow-400 rounded-xl p-4">
          <p className="text-xs opacity-70">ADMIN WALLET BALANCE</p>
          <p className="text-2xl font-black">₹{Number(wallet.balance)}</p>
          {wallet.upiId && (
            <p className="text-xs opacity-70 mt-1">UPI: {wallet.upiId}</p>
          )}
        </div>
      )}

      {withdrawals.length === 0 ? (
        <div
          data-ocid="withdrawals.empty_state"
          className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm"
        >
          <CreditCard className="mx-auto mb-2 opacity-40" size={32} />
          <p className="font-bold text-sm">NO PENDING WITHDRAWALS</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w, i) => {
            const u = getUserInfo(w.userId);
            return (
              <div
                key={w.id}
                data-ocid={`withdrawals.item.${i + 1}`}
                className="bg-white rounded-xl shadow-sm p-4"
              >
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={u?.profilePhotoUrl} />
                    <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                      {u?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-black text-sm">
                      {w.userName.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {u?.userId || w.userId}
                    </p>
                    <p className="text-xs font-bold text-orange-600 mt-1">
                      UPI: {w.userUpiId}
                    </p>
                    <p className="text-xs text-gray-400">
                      TYPE: {w.withdrawalType.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-green-600">
                      ₹{Number(w.amountRs)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(Number(w.requestedAt)).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    data-ocid={`withdrawals.confirm_button.${i + 1}`}
                    onClick={() => handleApprove(w)}
                    disabled={!!processing}
                    size="sm"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold"
                  >
                    {processing === w.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle size={14} className="mr-1" /> APPROVE
                      </>
                    )}
                  </Button>
                  <Button
                    data-ocid={`withdrawals.delete_button.${i + 1}`}
                    onClick={() => handleReject(w.id)}
                    disabled={!!processing}
                    size="sm"
                    variant="destructive"
                    className="flex-1 font-bold"
                  >
                    {processing === w.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <XCircle size={14} className="mr-1" /> REJECT
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// WALLET TAB
// ──────────────────────────────────────────────────────────────
function WalletTab({
  wallet,
  actor,
  actorRef,
  onRefresh,
}: {
  wallet: RMAdminWallet | null;
  actor: any;
  actorRef: React.RefObject<any>;
  onRefresh: () => void;
}) {
  const [upiId, setUpiId] = useState(wallet?.upiId || "");
  const [addAmt, setAddAmt] = useState("");
  const [busy, setBusy] = useState(false);

  const handleUpdateUpi = async () => {
    const a = actorRef.current || actor;
    if (!a || !wallet) return;
    setBusy(true);
    try {
      await a.updateAdminWallet({ ...wallet, upiId: upiId.trim() });
      toast.success("UPI ID UPDATED!");
      onRefresh();
    } catch {
      toast.error("UPDATE FAILED.");
    } finally {
      setBusy(false);
    }
  };

  const openPaymentApp = (app: string) => {
    const amt = Number.parseFloat(addAmt);
    if (!amt || amt <= 0) {
      toast.error("ENTER AMOUNT FIRST");
      return;
    }
    const upi = wallet?.upiId || "";
    const urls: Record<string, string> = {
      paytm: `paytmmp://pay?pa=${upi}&am=${amt}&cu=INR`,
      gpay: `tez://upi/pay?pa=${upi}&am=${amt}&cu=INR`,
      phonepe: `phonepe://pay?pa=${upi}&am=${amt}&cu=INR`,
    };
    const fallbacks: Record<string, string> = {
      paytm: "https://paytm.com",
      gpay: "https://pay.google.com",
      phonepe: "https://www.phonepe.com",
    };
    window.location.href = urls[app] || fallbacks[app];
    setTimeout(() => {
      window.location.href = fallbacks[app];
    }, 1500);
  };

  return (
    <div className="p-4 md:p-6 space-y-4" data-ocid="wallet.section">
      {/* Balance */}
      <div className="bg-black text-yellow-400 rounded-xl p-5">
        <p className="text-xs opacity-70">ADMIN WALLET BALANCE</p>
        <p className="text-4xl font-black mt-1">
          ₹{wallet ? Number(wallet.balance) : "—"}
        </p>
        <p className="text-xs opacity-60 mt-2">
          ADD MONEY VIA REAL PAYMENT ONLY
        </p>
      </div>

      {/* Add Money */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="font-black text-xs tracking-widest">ADD MONEY</h3>
        <Input
          data-ocid="wallet.amount.input"
          type="number"
          placeholder="AMOUNT IN ₹"
          value={addAmt}
          onChange={(e) => setAddAmt(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-2">
          <Button
            data-ocid="wallet.paytm.button"
            onClick={() => openPaymentApp("paytm")}
            className="font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white h-11"
          >
            PAYTM
          </Button>
          <Button
            data-ocid="wallet.gpay.button"
            onClick={() => openPaymentApp("gpay")}
            className="font-bold text-xs bg-green-600 hover:bg-green-700 text-white h-11"
          >
            GOOGLE PAY
          </Button>
          <Button
            data-ocid="wallet.phonepe.button"
            onClick={() => openPaymentApp("phonepe")}
            className="font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white h-11"
          >
            PHONEPE
          </Button>
        </div>
      </div>

      {/* UPI Settings */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="font-black text-xs tracking-widest">ADMIN UPI ID</h3>
        <Input
          data-ocid="wallet.upi.input"
          placeholder="YOUR UPI ID"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
        />
        <Button
          data-ocid="wallet.save_button"
          onClick={handleUpdateUpi}
          disabled={busy}
          className="w-full bg-black text-white hover:bg-gray-800 font-bold"
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            "SAVE UPI ID"
          )}
        </Button>
      </div>
    </div>
  );
}
