"use client";

import React from "react";
import Image from "next/image";

export interface AppItem {
  id: number | string;
  track_id: string;
  name: string;
  seller_name: string;
  app_store_url: string;
  icon_url: string;
  description: string;
  primary_genre: string;
  rating: number;
  rating_count: number;
  bid_amount: number;
  clicks_count: number;
  is_verified: boolean;
  rank: number;
  rank_display: string;
  is_top_three: boolean;
  utm_url: string;
}

interface LeaderboardTableProps {
  apps: AppItem[];
  totalApps: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onClaimRow: (app: AppItem | null) => void;
  onAppClick?: (app: AppItem) => void;
}

export default function LeaderboardTable({
  apps,
  totalApps,
  currentPage,
  totalPages,
  onPageChange,
  onClaimRow,
  onAppClick,
}: LeaderboardTableProps) {
  const startItem = totalApps === 0 ? 0 : (currentPage - 1) * 15 + 1;
  const endItem = Math.min(currentPage * 15, totalApps);

  const getRankBadge = (rank: number, rankDisplay: string) => {
    if (rank === 1) {
      return (
        <span className="rank-box">
          <span className="rank-crown">👑</span>
          <span>{rankDisplay}</span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="rank-box">
          <span className="rank-crown">🥈</span>
          <span>{rankDisplay}</span>
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="rank-box">
          <span className="rank-crown">🥉</span>
          <span>{rankDisplay}</span>
        </span>
      );
    }
    return <span className="rank-box">{rankDisplay}</span>;
  };

  const getRowClassName = (rank: number) => {
    let classes = "app-row";
    if (rank === 1) classes += " top-rank-1";
    else if (rank === 2) classes += " top-rank-2";
    else if (rank === 3) classes += " top-rank-3";
    return classes;
  };

  const handleAppClick = (app: AppItem) => {
    if (onAppClick) {
      onAppClick(app);
    }
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-card">
        <div className="leaderboard-header">
          <span className="leaderboard-tag">Leaderboard</span>
          <span className="leaderboard-count">{totalApps} products listed</span>
        </div>

        <div className="leaderboard-list">
          {apps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "52px 24px" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>🏆</div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px", color: "#09090b" }}>
                No iOS apps listed yet
              </h3>
              <p style={{ color: "#71717a", fontSize: "14px", marginBottom: "24px", maxWidth: "460px", margin: "0 auto 24px" }}>
                Be the first to claim rank #1! Verify your real iOS app on the Apple App Store and pay to rank.
              </p>
              <button
                type="button"
                onClick={() => onClaimRow(null)}
                className="claim-rank-primary-btn"
              >
                Claim Rank #1 for $1
              </button>
            </div>
          ) : (
            apps.map((app) => (
              <div key={app.track_id || app.id} className={getRowClassName(app.rank)}>
                {/* Rank */}
                {getRankBadge(app.rank, app.rank_display)}

                {/* Real App Icon */}
                <a
                  href={app.utm_url || app.app_store_url}
                  target="_blank"
                  rel="follow"
                  className="app-icon-wrapper"
                  onClick={() => handleAppClick(app)}
                  title={`Open ${app.name} on Apple App Store`}
                >
                  {app.icon_url ? (
                    <Image
                      src={app.icon_url}
                      alt={`${app.name} icon`}
                      width={44}
                      height={44}
                      className="app-icon-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="app-icon-placeholder">
                      {app.name.charAt(0)}
                    </div>
                  )}
                </a>

                {/* Real App Info with semantic crawlable link */}
                <div className="app-info">
                  <div className="app-title-line">
                    <a
                      href={app.utm_url || app.app_store_url}
                      target="_blank"
                      rel="follow"
                      className="app-title-link"
                      onClick={() => handleAppClick(app)}
                      title={`View ${app.name} on Apple App Store`}
                    >
                      {app.name}
                    </a>
                    {app.is_verified && (
                      <span className="verified-badge">✓ Verified</span>
                    )}
                  </div>
                  <div className="app-seller-line">
                    <a
                      href={app.utm_url || app.app_store_url}
                      target="_blank"
                      rel="follow"
                      className="app-seller-link"
                      onClick={() => handleAppClick(app)}
                    >
                      apps.apple.com/app/{app.seller_name || app.primary_genre || "ios"}
                    </a>
                    <span
                      className="mobile-only-clicks-stat"
                      onClick={() => handleAppClick(app)}
                      title="Live clicks tracked via WebSocket"
                    >
                      · {app.clicks_count} clicks
                    </span>
                  </div>
                  <div className="app-description" title={app.description}>
                    {app.description}
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="app-stats-actions">
                  <div
                    className="clicks-stat desktop-only-clicks-stat"
                    title="Live clicks tracked via WebSocket"
                    onClick={() => handleAppClick(app)}
                    style={{ cursor: "pointer" }}
                  >
                    {app.clicks_count} clicks
                  </div>
                  <div className="bid-price">${Math.round(app.bid_amount)}</div>
                  <button
                    type="button"
                    onClick={() => onClaimRow(app)}
                    className="claim-row-btn"
                  >
                    Claim
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 15 Ranks Pagination */}
        {totalApps > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {startItem}–{endItem} of {totalApps} apps
            </div>
            <div className="pagination-actions">
              <button
                type="button"
                className="page-btn"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`page-btn ${currentPage === p ? "active" : ""}`}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="leaderboard-footer-text">
        <p>
          Every listing links out with a do-follow backlink and Trendbit UTM tags
          — free traffic and SEO juice for your iOS app. Payments by Dodo Payments.
        </p>
        <p>Click any iOS app to visit it. Outbid the rank above you to move up.</p>
      </div>
    </div>
  );
}
