import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Task, WithdrawalRequest } from "../types";
import {
  generateId,
  generateOTP,
  getAdminSession,
  getAdminWallet,
  getCompletions,
  getOTPStore,
  getTasks,
  getUsers,
  getWithdrawals,
  saveAdminWallet,
  saveOTPStore,
  saveTasks,
  saveWithdrawals,
  setAdminSession,
} from "../utils/storage";

// ─── Admin Login ───────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotPhone, setForgotPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");

  const handleLogin = () => {
    if (phone === "9053405019" && password === "Rakhi5050") {
      setAdminSession(true);
      onLogin();
      toast.success("Welcome back, Admin!");
    } else {
      toast.error("Invalid credentials. Try 9053405019 / Rakhi5050");
    }
  };

  const handleSendOtp = () => {
    if (forgotPhone !== "9053405019") {
      toast.error("Phone number not found");
      return;
    }
    const otp = generateOTP();
    saveOTPStore({
      phone: forgotPhone,
      otp,
      expiry: Date.now() + 5 * 60 * 1000,
    });
    toast.info(`OTP for demo: ${otp}`, { duration: 30000 });
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    const store = getOTPStore();
    if (store && store.otp === enteredOtp && store.expiry > Date.now()) {
      saveOTPStore(null);
      setForgotMode(false);
      setOtpSent(false);
      toast.success("OTP verified! Your password is: Rakhi5050");
    } else {
      toast.error("Invalid or expired OTP");
    }
  };

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden">
            <img
              src="/assets/uploads/WhatsApp-Image-2026-03-14-at-6.32.40-AM-1.jpeg"
              alt="RMoney"
              className="w-full h-full object-cover object-center scale-150"
            />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            RMoney Admin
          </h1>
          <p className="text-muted-foreground mt-1">Management Portal</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              {forgotMode ? "Reset Password" : "Admin Login"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!forgotMode ? (
              <>
                <div>
                  <Label className="text-foreground">Mobile Number</Label>
                  <Input
                    data-ocid="admin.login.input"
                    className="mt-1"
                    placeholder="Enter Mobile Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Password</Label>
                  <Input
                    className="mt-1"
                    placeholder="Enter Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>
                <Button
                  data-ocid="admin.login.submit_button"
                  className="w-full bg-primary text-primary-foreground hover:opacity-90"
                  onClick={handleLogin}
                >
                  Login
                </Button>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline w-full text-center"
                  onClick={() => setForgotMode(true)}
                >
                  Forgot Password?
                </button>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-foreground">Mobile Number</Label>
                  <Input
                    className="mt-1"
                    placeholder="9053405019"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    type="tel"
                  />
                </div>
                {!otpSent ? (
                  <Button className="w-full" onClick={handleSendOtp}>
                    Send OTP
                  </Button>
                ) : (
                  <>
                    <div>
                      <Label className="text-foreground">Enter OTP</Label>
                      <Input
                        className="mt-1"
                        placeholder="6-Digit OTP"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={handleVerifyOtp}>
                      Verify OTP
                    </Button>
                  </>
                )}
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:underline w-full text-center"
                  onClick={() => {
                    setForgotMode(false);
                    setOtpSent(false);
                  }}
                >
                  Back To Login
                </button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab() {
  const wallet = getAdminWallet();
  const users = getUsers();
  const tasks = getTasks();
  const completions = getCompletions();
  const withdrawals = getWithdrawals();
  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Wallet Balance</p>
            <p className="text-2xl font-bold text-primary">
              ₹{wallet.balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-accent/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Pending Withdrawals</p>
            <p className="text-2xl font-bold text-accent-foreground">
              {pendingCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Active Tasks</p>
            <p className="text-2xl font-bold text-foreground">
              {tasks.filter((t) => t.active).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Live Task Completions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Completed At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completions
                .slice()
                .reverse()
                .slice(0, 20)
                .map((c) => {
                  const user = users.find((u) => u.id === c.userId);
                  const task = tasks.find((t) => t.id === c.taskId);
                  return (
                    <TableRow key={c.id}>
                      <TableCell>{user?.name ?? "Unknown"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {c.userId}
                      </TableCell>
                      <TableCell>{task?.title ?? "Unknown Task"}</TableCell>
                      <TableCell>
                        {new Date(c.completedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              {completions.length === 0 && (
                <TableRow data-ocid="dashboard.empty_state">
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-6"
                  >
                    No Task Completions Yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tasks Tab ─────────────────────────────────────────────────────────────────
function TasksTab() {
  const [tasks, setTasksState] = useState<Task[]>(getTasks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState({
    sequence: "",
    title: "",
    description: "",
    rules: "",
    price: "",
    url: "",
    apkImageUrl: "",
    coinsReward: "",
    active: true,
  });

  const refresh = () => setTasksState(getTasks());

  const openAdd = () => {
    setEditTask(null);
    setForm({
      sequence: "",
      title: "",
      description: "",
      rules: "",
      price: "",
      url: "",
      apkImageUrl: "",
      coinsReward: "",
      active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setForm({
      sequence: task.sequence.toString(),
      title: task.title,
      description: task.description,
      rules: task.rules ?? "",
      price: task.price?.toString() ?? "",
      url: task.url,
      apkImageUrl: task.apkImageUrl ?? "",
      coinsReward: task.coinsReward.toString(),
      active: task.active,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.url || !form.sequence) {
      toast.error("Please fill required fields");
      return;
    }
    const current = getTasks();
    if (editTask) {
      const updated = current.map((t) =>
        t.id === editTask.id
          ? {
              ...t,
              sequence: Number(form.sequence),
              title: form.title,
              description: form.description,
              rules: form.rules || undefined,
              price: form.price ? Number(form.price) : undefined,
              url: form.url,
              apkImageUrl: form.apkImageUrl,
              coinsReward: Number(form.coinsReward) || 100,
              active: form.active,
            }
          : t,
      );
      saveTasks(updated);
    } else {
      const newTask: Task = {
        id: generateId(),
        sequence: Number(form.sequence),
        title: form.title,
        description: form.description,
        rules: form.rules || undefined,
        price: form.price ? Number(form.price) : undefined,
        url: form.url,
        apkImageUrl: form.apkImageUrl,
        coinsReward: Number(form.coinsReward) || 100,
        active: form.active,
      };
      saveTasks([...current, newTask]);
    }
    setDialogOpen(false);
    refresh();
    toast.success(editTask ? "Task updated!" : "Task added!");
  };

  const handleDelete = (id: string) => {
    saveTasks(getTasks().filter((t) => t.id !== id));
    refresh();
    toast.success("Task deleted");
  };

  const toggleActive = (task: Task) => {
    saveTasks(
      getTasks().map((t) =>
        t.id === task.id ? { ...t, active: !t.active } : t,
      ),
    );
    refresh();
  };

  const sorted = [...tasks].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Tasks ({tasks.length})</h2>
        <Button
          data-ocid="admin.tasks.add_button"
          onClick={openAdd}
          className="bg-primary text-primary-foreground"
        >
          + Add Task
        </Button>
      </div>

      <div className="space-y-3">
        {sorted.map((task, idx) => (
          <Card
            key={task.id}
            data-ocid={`admin.tasks.item.${idx + 1}`}
            className="border-border"
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                    {task.sequence}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {task.url}
                    </p>
                    <p className="text-xs text-accent-foreground font-medium">
                      🪙 {task.coinsReward} coins
                      {task.price !== undefined && (
                        <span className="ml-2 text-emerald-400 font-semibold">
                          ₹{task.price}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={task.active}
                    onCheckedChange={() => toggleActive(task)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(task)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(task.id)}
                  >
                    Del
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {sorted.length === 0 && (
          <Card data-ocid="admin.tasks.empty_state">
            <CardContent className="py-12 text-center text-muted-foreground">
              No Tasks Yet. Add Your First Task.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="dark max-w-md">
          <DialogHeader>
            <DialogTitle>{editTask ? "Edit Task" : "Add Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sequence #</Label>
                <Input
                  type="number"
                  value={form.sequence}
                  onChange={(e) =>
                    setForm({ ...form, sequence: e.target.value })
                  }
                  placeholder="1"
                />
              </div>
              <div>
                <Label>Coins Reward</Label>
                <Input
                  type="number"
                  value={form.coinsReward}
                  onChange={(e) =>
                    setForm({ ...form, coinsReward: e.target.value })
                  }
                  placeholder="500"
                />
              </div>
            </div>
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Task Title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Task Description"
                rows={2}
              />
            </div>
            <div>
              <Label>Task Rules</Label>
              <Textarea
                value={form.rules}
                onChange={(e) => setForm({ ...form, rules: e.target.value })}
                placeholder={
                  "e.g.\n1. Download the app\n2. Register with your phone\n3. Complete the first order"
                }
                rows={4}
              />
            </div>
            <div>
              <Label>Price (₹)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>URL *</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>APK Image URL</Label>
              <Input
                value={form.apkImageUrl}
                onChange={(e) =>
                  setForm({ ...form, apkImageUrl: e.target.value })
                }
                placeholder="https://... (optional)"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary text-primary-foreground"
            >
              Save Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Wallet Tab ─────────────────────────────────────────────────────────────────
function WalletTab() {
  const [wallet, setWalletState] = useState(getAdminWallet);
  const [addOpen, setAddOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [upiInput, setUpiInput] = useState(wallet.upiId);

  const refresh = () => setWalletState(getAdminWallet());

  const handleAdd = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    const w = getAdminWallet();
    w.balance += amt;
    w.transactions.unshift({
      id: generateId(),
      type: "credit",
      amount: amt,
      method,
      description: `Added via ${method}`,
      date: new Date().toISOString(),
    });
    saveAdminWallet(w);
    setAmount("");
    setAddOpen(false);
    refresh();
    toast.success(`₹${amt} added via ${method}`);
  };

  const saveUpi = () => {
    const w = getAdminWallet();
    w.upiId = upiInput.trim();
    saveAdminWallet(w);
    refresh();
    toast.success("Admin UPI ID updated!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-4xl font-bold font-display text-primary">
            ₹{wallet.balance.toFixed(2)}
          </p>
        </div>
        <Button
          data-ocid="admin.wallet.add_button"
          onClick={() => setAddOpen(true)}
          className="bg-primary text-primary-foreground"
        >
          + Add Money
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Admin UPI ID</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            data-ocid="admin.wallet.upi.input"
            value={upiInput}
            onChange={(e) => setUpiInput(e.target.value)}
            placeholder="Enter UPI ID (e.g. 9053405019@upi)"
            className="flex-1"
          />
          <Button
            data-ocid="admin.wallet.upi.save_button"
            onClick={saveUpi}
            variant="outline"
          >
            Save UPI
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallet.transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <Badge
                      variant={tx.type === "credit" ? "default" : "destructive"}
                    >
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={
                      tx.type === "credit"
                        ? "text-primary font-medium"
                        : "text-destructive font-medium"
                    }
                  >
                    {tx.type === "credit" ? "+" : "-"}₹{tx.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{tx.method}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(tx.date).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {wallet.transactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-6"
                  >
                    No Transactions Yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="dark max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Money to Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-primary text-primary-foreground"
            >
              Add Money
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Withdrawal Tab ─────────────────────────────────────────────────────────────
function WithdrawalTab({ type }: { type: "task" | "referral" }) {
  const [withdrawals, setW] = useState<WithdrawalRequest[]>(() =>
    getWithdrawals().filter((w) => w.type === type),
  );
  const [confirmItem, setConfirmItem] = useState<WithdrawalRequest | null>(
    null,
  );
  const [rejectItem, setRejectItem] = useState<WithdrawalRequest | null>(null);

  const refresh = () => setW(getWithdrawals().filter((w) => w.type === type));

  const handleApprove = () => {
    if (!confirmItem) return;
    const wallet = getAdminWallet();
    if (wallet.balance < confirmItem.amountRs) {
      toast.error("Insufficient admin wallet balance!");
      return;
    }
    wallet.balance -= confirmItem.amountRs;
    wallet.transactions.unshift({
      id: generateId(),
      type: "debit",
      amount: confirmItem.amountRs,
      method: "UPI",
      description: `Withdrawal to ${confirmItem.userName} (${confirmItem.userId}) UPI: ${confirmItem.userUpiId}`,
      date: new Date().toISOString(),
    });
    saveAdminWallet(wallet);
    const all = getWithdrawals().map((w) =>
      w.id === confirmItem.id
        ? {
            ...w,
            status: "approved" as const,
            processedAt: new Date().toISOString(),
          }
        : w,
    );
    saveWithdrawals(all);
    setConfirmItem(null);
    refresh();
    toast.success(`Withdrawal of ₹${confirmItem.amountRs} approved!`);
  };

  const handleReject = () => {
    if (!rejectItem) return;
    const all = getWithdrawals().map((w) =>
      w.id === rejectItem.id
        ? {
            ...w,
            status: "rejected" as const,
            processedAt: new Date().toISOString(),
          }
        : w,
    );
    saveWithdrawals(all);
    setRejectItem(null);
    refresh();
    toast.success("Withdrawal rejected");
  };

  const pending = withdrawals.filter((w) => w.status === "pending");
  const processed = withdrawals.filter((w) => w.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">
          {type === "task" ? "Task" : "Referral"} Withdrawals
        </h2>
        {pending.length > 0 && (
          <Badge variant="destructive">{pending.length} Pending</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-amber-400">
            ⏳ Pending Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>UPI ID</TableHead>
                <TableHead>Coins</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((w, idx) => (
                <TableRow
                  key={w.id}
                  data-ocid={`admin.withdrawals.row.${idx + 1}`}
                >
                  <TableCell>
                    {w.userName}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {w.userPhone}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {w.userId}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {w.userUpiId}
                  </TableCell>
                  <TableCell>🪙 {w.coins}</TableCell>
                  <TableCell className="font-semibold text-primary">
                    ₹{w.amountRs.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(w.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        data-ocid={`admin.withdrawals.approve_button.${idx + 1}`}
                        size="sm"
                        className="bg-primary text-primary-foreground"
                        onClick={() => setConfirmItem(w)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectItem(w)}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pending.length === 0 && (
                <TableRow data-ocid="admin.withdrawals.empty_state">
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-6"
                  >
                    No Pending Requests
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {processed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Processed Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>UPI</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processed.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>
                      {w.userName}{" "}
                      <span className="text-xs font-mono text-muted-foreground">
                        ({w.userId})
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {w.userUpiId}
                    </TableCell>
                    <TableCell>₹{w.amountRs.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          w.status === "approved" ? "default" : "destructive"
                        }
                      >
                        {w.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {w.processedAt
                        ? new Date(w.processedAt).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog
        open={!!confirmItem}
        onOpenChange={(open) => !open && setConfirmItem(null)}
      >
        <DialogContent className="dark max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Approval</DialogTitle>
          </DialogHeader>
          {confirmItem && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">User Name:</span>
                <span className="font-semibold">{confirmItem.userName}</span>
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono">{confirmItem.userId}</span>
                <span className="text-muted-foreground">UPI ID:</span>
                <span className="font-mono text-primary">
                  {confirmItem.userUpiId}
                </span>
                <span className="text-muted-foreground">Coins:</span>
                <span>🪙 {confirmItem.coins}</span>
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-primary text-lg">
                  ₹{confirmItem.amountRs.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Send ₹{confirmItem.amountRs.toFixed(2)} to UPI:{" "}
                <strong>{confirmItem.userUpiId}</strong>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              data-ocid="admin.withdrawals.cancel_button"
              variant="outline"
              onClick={() => setConfirmItem(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.withdrawals.confirm_button"
              className="bg-primary text-primary-foreground"
              onClick={handleApprove}
            >
              Confirm Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectItem}
        onOpenChange={(open) => !open && setRejectItem(null)}
      >
        <DialogContent className="dark max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Withdrawal?</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Are you sure you want to reject the withdrawal request from{" "}
            <strong>{rejectItem?.userName}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectItem(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const users = getUsers();
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">All Users ({users.length})</h2>
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Coins</TableHead>
                <TableHead>Referral Coins</TableHead>
                <TableHead>UPI ID</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="font-mono text-xs">{u.id}</TableCell>
                  <TableCell>{u.phone}</TableCell>
                  <TableCell>🪙 {u.coinBalance}</TableCell>
                  <TableCell>🪙 {u.referralCoinBalance}</TableCell>
                  <TableCell className="text-xs">{u.upiId || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow data-ocid="admin.users.empty_state">
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-6"
                  >
                    No Users Registered Yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Admin Dashboard ───────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const withdrawals = getWithdrawals();
  const taskPending = withdrawals.filter(
    (w) => w.type === "task" && w.status === "pending",
  ).length;
  const refPending = withdrawals.filter(
    (w) => w.type === "referral" && w.status === "pending",
  ).length;

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src="/assets/uploads/WhatsApp-Image-2026-03-14-at-6.32.40-AM-1.jpeg"
              alt="RMoney"
              className="w-full h-full object-cover object-center scale-150"
            />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            RMoney Admin
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAdminSession(false);
            onLogout();
          }}
        >
          Logout
        </Button>
      </header>

      {/* Main */}
      <main className="p-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="withdrawals" className="relative">
              Withdrawals
              {taskPending > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5">
                  {taskPending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="referral-withdrawals" className="relative">
              Referral W/D
              {refPending > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5">
                  {refPending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="tasks">
            <TasksTab />
          </TabsContent>
          <TabsContent value="wallet">
            <WalletTab />
          </TabsContent>
          <TabsContent value="withdrawals">
            <WithdrawalTab type="task" />
          </TabsContent>
          <TabsContent value="referral-withdrawals">
            <WithdrawalTab type="referral" />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ─── Admin Portal Root ─────────────────────────────────────────────────────────
export default function AdminPortal() {
  const [loggedIn, setLoggedIn] = useState(getAdminSession);
  return loggedIn ? (
    <AdminDashboard onLogout={() => setLoggedIn(false)} />
  ) : (
    <AdminLogin onLogin={() => setLoggedIn(true)} />
  );
}
