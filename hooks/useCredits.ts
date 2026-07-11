"use client";

import { useState, useEffect, useCallback } from "react";

interface CreditData {
  balance: number | null;
  loading: boolean;
  refresh: () => void;
}

export function useCredits(): CreditData {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/credits");
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refresh: fetchBalance };
}
