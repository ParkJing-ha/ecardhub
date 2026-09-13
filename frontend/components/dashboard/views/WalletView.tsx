import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createWalletTopup,
  getWalletTransactions,
  type WalletTransaction,
} from "@/lib/data";
import { formatDateTime, PAYMENT_METHODS } from "@/lib/constants";
import { useIsMobile } from "../hooks";
import { SectionHeader } from "../ui";

export function WalletView() {
  const isMobile = useIsMobile();
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setTransactions(await getWalletTransactions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(loadTransactions);
  }, [loadTransactions]);

  const balance = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.status === "completed")
        .reduce((total, transaction) => {
          return transaction.direction === "credit"
            ? total + transaction.amount
            : total - transaction.amount;
        }, 0),
    [transactions],
  );

  const handleTopup = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;

    setSaving(true);
    setMessage("");

    try {
      await createWalletTopup({
        amount: numericAmount,
        provider: method,
      });
      setAmount("");
      setMessage(
        "Top-up request saved as pending. Connect the payment gateway callback to mark it completed.",
      );
      loadTransactions();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create top-up.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader title="Wallet & Payments" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 360px",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            className="card-base"
            style={{
              padding: "28px",
              borderColor: "rgba(201,168,76,0.25)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--muted-foreground)",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Available Balance
            </div>
            <div
              style={{
                fontFamily: "DM Serif Display, serif",
                fontSize: 44,
                color: "var(--accent-text)",
                lineHeight: 1,
              }}
            >
              TZS {balance.toLocaleString()}
            </div>
            <div style={{ color: "var(--muted-foreground)", fontSize: 13, marginTop: 10 }}>
              Balance is calculated from completed wallet transactions.
            </div>
          </div>

          <div className="card-base p-5">
            <h3
              style={{
                fontFamily: "DM Serif Display, serif",
                fontSize: 18,
                margin: "0 0 18px",
                color: "var(--foreground)",
              }}
            >
              Top Up Wallet
            </h3>

            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ color: "var(--muted-foreground)", fontSize: 12, fontWeight: 600 }}>
                Payment Method
              </span>
              <select
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                style={{
                  marginTop: 8,
                  width: "100%",
                  height: 38,
                  borderRadius: 8,
                  border: "1px solid rgba(201,168,76,0.22)",
                  background: "var(--card)",
                  color: "var(--foreground)",
                  padding: "0 10px",
                }}
              >
                {PAYMENT_METHODS.map((paymentMethod) => (
                  <option key={paymentMethod} value={paymentMethod}>
                    {paymentMethod}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ color: "var(--muted-foreground)", fontSize: 12, fontWeight: 600 }}>
                Amount (TZS)
              </span>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="50000"
                style={{ marginTop: 8 }}
              />
            </label>

            <button
              className="btn-gold"
              disabled={!amount || saving}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                opacity: amount && !saving ? 1 : 0.55,
              }}
              onClick={handleTopup}
            >
              {saving ? "Saving..." : "Create Top-up Request"}
            </button>

            {message && (
              <div style={{ color: "var(--muted-foreground)", fontSize: 13, marginTop: 12 }}>
                {message}
              </div>
            )}
          </div>
        </div>

        <div className="card-base p-5">
          <h3
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: 18,
              margin: "0 0 16px",
              color: "var(--foreground)",
            }}
          >
            Transaction History
          </h3>

          {loading ? (
            <div style={{ color: "var(--muted-foreground)", fontSize: 13 }}>Loading...</div>
          ) : transactions.length === 0 ? (
            <div style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
              No wallet transactions yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: "var(--foreground)",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {transaction.description || transaction.provider || "Wallet transaction"}
                    </div>
                    <div style={{ color: "var(--muted-foreground)", fontSize: 11, marginTop: 3 }}>
                      {formatDateTime(transaction.created_at)} · {transaction.status}
                    </div>
                  </div>
                  <div
                    style={{
                      color:
                        transaction.direction === "credit" ? "#22c55e" : "#ef4444",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {transaction.direction === "credit" ? "+" : "-"}TZS{" "}
                    {transaction.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
