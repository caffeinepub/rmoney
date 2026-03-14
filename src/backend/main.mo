import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Order "mo:core/Order";


actor {
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // ─── Types ───────────────────────────────────────────────────────────────────

  type Task = {
    id : Text;
    sequence : Nat;
    title : Text;
    description : Text;
    rules : Text;
    url : Text;
    imageUrl : Text;
    coinsReward : Nat;
    active : Bool;
  };

  type User = {
    id : Text;
    phone : Text;
    name : Text;
    userId : Text;
    referralCode : Text;
    referredBy : Text;
    profilePhotoUrl : Text;
    upiId : Text;
    upiLocked : Bool;
    coinBalance : Nat;
    referralCoinBalance : Nat;
    hasCompletedFirstTask : Bool;
    taskWithdrawalsToday : Nat;
    lastWithdrawalDate : Text;
    createdAt : Int;
  };

  type TaskCompletion = {
    id : Text;
    userId : Text;
    taskId : Text;
    status : Text;
    submittedAt : Int;
    confirmedAt : Int;
  };

  type WithdrawalRequest = {
    id : Text;
    userId : Text;
    userName : Text;
    userPhone : Text;
    userUpiId : Text;
    coins : Nat;
    amountRs : Nat;
    withdrawalType : Text;
    status : Text;
    requestedAt : Int;
    processedAt : Int;
  };

  type AdminWallet = {
    balance : Nat;
    upiId : Text;
  };

  type OTPEntry = {
    otp : Text;
    expiry : Int;
  };

  // ─── Stable Storage ──────────────────────────────────────────────────────────

  let tasks : Map.Map<Text, Task> = Map.empty();
  let users : Map.Map<Text, User> = Map.empty();
  let completions : Map.Map<Text, TaskCompletion> = Map.empty();
  let withdrawals : Map.Map<Text, WithdrawalRequest> = Map.empty();
  let otpMap : Map.Map<Text, OTPEntry> = Map.empty();
  let passwordMap : Map.Map<Text, Text> = Map.empty();
  var adminWallet : AdminWallet = { balance = 0; upiId = "" };

  // upsert: remove old entry then add new one
  func upsert<V>(m : Map.Map<Text, V>, key : Text, value : V) {
    m.remove(key);
    m.add(key, value);
  };

  // ─── Task Functions ───────────────────────────────────────────────────────────

  public func getTasks() : async [Task] {
    tasks.values().toArray().sort(func(a : Task, b : Task) : Order.Order {
      Nat.compare(a.sequence, b.sequence)
    })
  };

  public func addTask(task : Task) : async () {
    upsert(tasks, task.id, task);
  };

  public func updateTask(task : Task) : async () {
    upsert(tasks, task.id, task);
  };

  public func deleteTask(id : Text) : async () {
    tasks.remove(id);
  };

  // ─── User Functions ───────────────────────────────────────────────────────────

  public func registerUser(user : User) : async Bool {
    for ((_, u) in users.entries()) {
      if (u.phone == user.phone) return false;
    };
    users.add(user.id, user);
    true
  };

  public func getUserByPhone(phone : Text) : async ?User {
    for ((_, u) in users.entries()) {
      if (u.phone == phone) return ?u;
    };
    null
  };

  public func getUserById(id : Text) : async ?User {
    users.get(id)
  };

  public func getUserByUserId(userId : Text) : async ?User {
    for ((_, u) in users.entries()) {
      if (u.userId == userId) return ?u;
    };
    null
  };

  public func getUserByReferralCode(code : Text) : async ?User {
    for ((_, u) in users.entries()) {
      if (u.referralCode == code) return ?u;
    };
    null
  };

  public func updateUser(user : User) : async () {
    upsert(users, user.id, user);
  };

  public func getAllUsers() : async [User] {
    users.values().toArray().sort(func(a : User, b : User) : Order.Order {
      Int.compare(b.createdAt, a.createdAt)
    })
  };

  // ─── Task Completion Functions ────────────────────────────────────────────────

  public func submitCompletion(completion : TaskCompletion) : async () {
    upsert(completions, completion.id, completion);
  };

  public func confirmCompletion(id : Text) : async Bool {
    switch (completions.get(id)) {
      case null { false };
      case (?c) {
        upsert(completions, id, {
          id = c.id; userId = c.userId; taskId = c.taskId;
          status = "confirmed"; submittedAt = c.submittedAt;
          confirmedAt = Time.now();
        });

        switch (users.get(c.userId)) {
          case null {};
          case (?u) {
            var reward : Nat = 0;
            switch (tasks.get(c.taskId)) {
              case (?t) { reward := t.coinsReward };
              case null {};
            };

            let isFirstTask = not u.hasCompletedFirstTask;
            let updatedUser : User = {
              id = u.id; phone = u.phone; name = u.name;
              userId = u.userId; referralCode = u.referralCode;
              referredBy = u.referredBy; profilePhotoUrl = u.profilePhotoUrl;
              upiId = u.upiId; upiLocked = u.upiLocked;
              coinBalance = u.coinBalance + reward;
              referralCoinBalance = u.referralCoinBalance;
              hasCompletedFirstTask = true;
              taskWithdrawalsToday = u.taskWithdrawalsToday;
              lastWithdrawalDate = u.lastWithdrawalDate;
              createdAt = u.createdAt;
            };
            upsert(users, u.id, updatedUser);

            if (isFirstTask and u.referredBy != "") {
              // Friend gets 200 bonus coins
              upsert(users, updatedUser.id, {
                id = updatedUser.id; phone = updatedUser.phone;
                name = updatedUser.name; userId = updatedUser.userId;
                referralCode = updatedUser.referralCode;
                referredBy = updatedUser.referredBy;
                profilePhotoUrl = updatedUser.profilePhotoUrl;
                upiId = updatedUser.upiId; upiLocked = updatedUser.upiLocked;
                coinBalance = updatedUser.coinBalance + 200;
                referralCoinBalance = updatedUser.referralCoinBalance;
                hasCompletedFirstTask = true;
                taskWithdrawalsToday = updatedUser.taskWithdrawalsToday;
                lastWithdrawalDate = updatedUser.lastWithdrawalDate;
                createdAt = updatedUser.createdAt;
              });

              // Referrer gets 500 coins
              switch (users.get(u.referredBy)) {
                case null {};
                case (?referrer) {
                  upsert(users, referrer.id, {
                    id = referrer.id; phone = referrer.phone;
                    name = referrer.name; userId = referrer.userId;
                    referralCode = referrer.referralCode;
                    referredBy = referrer.referredBy;
                    profilePhotoUrl = referrer.profilePhotoUrl;
                    upiId = referrer.upiId; upiLocked = referrer.upiLocked;
                    coinBalance = referrer.coinBalance;
                    referralCoinBalance = referrer.referralCoinBalance + 500;
                    hasCompletedFirstTask = referrer.hasCompletedFirstTask;
                    taskWithdrawalsToday = referrer.taskWithdrawalsToday;
                    lastWithdrawalDate = referrer.lastWithdrawalDate;
                    createdAt = referrer.createdAt;
                  });
                };
              };
            };
          };
        };
        true
      };
    }
  };

  public func getCompletionsByUser(userId : Text) : async [TaskCompletion] {
    completions.values().toArray().filter(func(c : TaskCompletion) : Bool { c.userId == userId })
  };

  public func getAllCompletions() : async [TaskCompletion] {
    completions.values().toArray()
  };

  public func getAllPendingCompletions() : async [TaskCompletion] {
    completions.values().toArray().filter(func(c : TaskCompletion) : Bool { c.status == "pending" })
  };

  // ─── Withdrawal Functions ─────────────────────────────────────────────────────

  public func requestWithdrawal(req : WithdrawalRequest) : async () {
    upsert(withdrawals, req.id, req);
  };

  public func approveWithdrawal(id : Text) : async Bool {
    switch (withdrawals.get(id)) {
      case null { false };
      case (?w) {
        upsert(withdrawals, id, {
          id = w.id; userId = w.userId; userName = w.userName;
          userPhone = w.userPhone; userUpiId = w.userUpiId;
          coins = w.coins; amountRs = w.amountRs;
          withdrawalType = w.withdrawalType; status = "approved";
          requestedAt = w.requestedAt; processedAt = Time.now();
        });
        if (adminWallet.balance >= w.amountRs) {
          adminWallet := { balance = adminWallet.balance - w.amountRs; upiId = adminWallet.upiId };
        };
        true
      };
    }
  };

  public func rejectWithdrawal(id : Text) : async Bool {
    switch (withdrawals.get(id)) {
      case null { false };
      case (?w) {
        upsert(withdrawals, id, {
          id = w.id; userId = w.userId; userName = w.userName;
          userPhone = w.userPhone; userUpiId = w.userUpiId;
          coins = w.coins; amountRs = w.amountRs;
          withdrawalType = w.withdrawalType; status = "rejected";
          requestedAt = w.requestedAt; processedAt = Time.now();
        });
        true
      };
    }
  };

  public func getWithdrawalsByUser(userId : Text) : async [WithdrawalRequest] {
    withdrawals.values().toArray().filter(func(w : WithdrawalRequest) : Bool { w.userId == userId })
  };

  public func getAllPendingWithdrawals() : async [WithdrawalRequest] {
    withdrawals.values().toArray().filter(func(w : WithdrawalRequest) : Bool { w.status == "pending" })
  };

  public func getAllWithdrawals() : async [WithdrawalRequest] {
    withdrawals.values().toArray()
  };

  // ─── Admin Wallet ─────────────────────────────────────────────────────────────

  public func getAdminWallet() : async AdminWallet {
    adminWallet
  };

  public func updateAdminWallet(wallet : AdminWallet) : async () {
    adminWallet := wallet;
  };

  // ─── OTP Functions ────────────────────────────────────────────────────────────

  public func saveOTP(phone : Text, otp : Text) : async () {
    let expiry = Time.now() + 10 * 60 * 1_000_000_000;
    upsert(otpMap, phone, { otp; expiry });
  };

  public func getOTP(phone : Text) : async ?Text {
    switch (otpMap.get(phone)) {
      case null { null };
      case (?entry) {
        if (entry.expiry < Time.now()) {
          otpMap.remove(phone);
          null
        } else {
          ?entry.otp
        }
      };
    }
  };

  public func clearOTP(phone : Text) : async () {
    otpMap.remove(phone);
  };

  // ─── Password Functions ────────────────────────────────────────────────────────

  public func savePassword(phone : Text, password : Text) : async () {
    upsert(passwordMap, phone, password);
  };

  public func verifyPassword(phone : Text, password : Text) : async Bool {
    switch (passwordMap.get(phone)) {
      case null { false };
      case (?stored) { stored == password };
    }
  };
};
