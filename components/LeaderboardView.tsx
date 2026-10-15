"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Header from "./Header";
import Hero from "./Hero";
import LeaderboardTable, { AppItem } from "./LeaderboardTable";
import ClaimModal from "./ClaimModal";

interface InitialData {
  apps: AppItem[];
  total_items: number;
  total_pages: number;
  claim_rank_1_price: number;
  active_users: number;
  total_visitors: number;
}

export default function LeaderboardView({
  initialData,
}: {
  initialData: InitialData;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [apps, setApps] = useState<AppItem[]>(initialData?.apps || []);
  const [totalApps, setTotalApps] = useState<number>(initialData?.total_items || 0);
  const [totalPages, setTotalPages] = useState<number>(initialData?.total_pages || 1);
  const [topBidPrice, setTopBidPrice] = useState<number>(
    initialData?.claim_rank_1_price || 1
  );
  const [selectedBid, setSelectedBid] = useState<number>(
    initialData?.claim_rank_1_price || 1
  );

  const [activeUsers, setActiveUsers] = useState<number>(
    initialData?.active_users || 0
  );
  const [totalVisitors, setTotalVisitors] = useState<number>(
    initialData?.total_visitors || 0
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialApp, setModalInitialApp] = useState<AppItem | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch paginated leaderboard from backend
  const fetchLeaderboard = useCallback(async (page: number) => {
    try {
      const res = await fetch(`/api/leaderboard?page=${page}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setApps(data.apps || []);
        setTotalApps(data.total_items || 0);
        setTotalPages(data.total_pages || 1);
        setTopBidPrice(data.claim_rank_1_price || 1);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  }, []);

  // Check URL query parameters for return from Dodo Payments checkout
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get("payment") || params.get("status");
      const sessionId = params.get("session_id");
      const paymentId = params.get("payment_id");

      if (paymentStatus === "success" || paymentStatus === "succeeded" || sessionId || paymentId) {
        const query = new URLSearchParams();
        if (sessionId) query.set("session_id", sessionId);
        if (paymentId) query.set("payment_id", paymentId);
        if (paymentStatus) query.set("status", paymentStatus);

        // Verify payment with backend
        fetch(`/api/payments/verify?${query.toString()}`)
          .then((r) => r.json())
          .then(() => {
            fetchLeaderboard(1);
          })
          .catch(() => {});
      }
    }
  }, [fetchLeaderboard]);

  // Record visitor hit and connect live WebSocket
  useEffect(() => {
    // 1. Record real visitor hit on mount
    fetch("/api/visitor/hit", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.total_visitors === "number") {
          setTotalVisitors(data.total_visitors);
        }
        if (typeof data.active_users === "number") {
          setActiveUsers(data.active_users);
        }
      })
      .catch(() => {});

    // 2. Setup WebSocket connection for live active users and live visitor count updates
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
      if (process.env.NEXT_PUBLIC_API_URL) {
        const cleanApi = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
        wsUrl = cleanApi.replace(/^http/, "ws") + "/ws";
      } else if (isLocal) {
        wsUrl = `${protocol}//${window.location.hostname}:8000/ws`;
      } else {
        wsUrl = `${protocol}//api.trendbit.lol/ws`;
      }
    }

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected to Trendbit live server.");
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "STATS_UPDATE") {
              if (typeof msg.active_users === "number") {
                setActiveUsers(msg.active_users);
              }
              if (typeof msg.total_visitors === "number") {
                setTotalVisitors(msg.total_visitors);
              }
            } else if (msg.type === "APP_CLICK_UPDATE") {
              // Real-time WebSocket update for clicks count across all connected clients
              if (msg.product_id || msg.track_id) {
                setApps((prevApps) =>
                  prevApps.map((app) => {
                    const matchId = msg.product_id && String(app.id) === String(msg.product_id);
                    const matchTrack = msg.track_id && String(app.track_id) === String(msg.track_id);
                    if (matchId || matchTrack) {
                      return {
                        ...app,
                        clicks_count: typeof msg.clicks_count === "number" ? msg.clicks_count : app.clicks_count + 1,
                      };
                    }
                    return app;
                  })
                );
              }
            } else if (msg.type === "LEADERBOARD_UPDATED") {
              fetchLeaderboard(currentPage);
            }
          } catch {
            // non-json
          }
        };

        ws.onclose = () => {
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (e) {
        console.warn("Could not connect WebSocket:", e);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentPage, fetchLeaderboard]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchLeaderboard(newPage);
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  const handleClaimRow = (app: AppItem | null) => {
    if (app) {
      const nextBid = Math.round(app.bid_amount + 1);
      setSelectedBid(nextBid);
      setModalInitialApp(app);
    } else {
      setSelectedBid(topBidPrice || 1);
      setModalInitialApp(null);
    }
    setIsModalOpen(true);
  };

  const handleOpenHeroModal = () => {
    setModalInitialApp(null);
    setIsModalOpen(true);
  };

  const handleAppClick = useCallback((app: AppItem) => {
    // 1. Optimistically increment click count locally for zero-latency UI update
    setApps((prevApps) =>
      prevApps.map((a) => {
        const matchId = String(a.id) === String(app.id);
        const matchTrack = app.track_id && String(a.track_id) === String(app.track_id);
        if (matchId || matchTrack) {
          return {
            ...a,
            clicks_count: (a.clicks_count || 0) + 1,
          };
        }
        return a;
      })
    );

    // 2. Broadcast click action in real-time via WebSocket to all connected clients
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(
          JSON.stringify({
            action: "click_app",
            product_id: app.id,
            track_id: app.track_id,
            app_name: app.name,
          })
        );
      } catch {
        // ws error
      }
    }
  }, []);

  return (
    <main>
      <Header activeUsers={activeUsers} totalVisitors={totalVisitors} />

      <Hero
        topBidPrice={topBidPrice}
        selectedBid={selectedBid}
        onBidChange={setSelectedBid}
        onOpenModal={handleOpenHeroModal}
      />

      <LeaderboardTable
        apps={apps}
        totalApps={totalApps}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onClaimRow={handleClaimRow}
        onAppClick={handleAppClick}
      />

      <ClaimModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialBid={selectedBid}
        initialApp={modalInitialApp}
        allApps={apps}
        onBidSuccess={() => fetchLeaderboard(currentPage)}
      />
    </main>
  );
}
