"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { AppItem } from "./LeaderboardTable";

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBid: number;
  initialApp?: AppItem | null;
  allApps: AppItem[];
  onBidSuccess: () => void;
}

interface VerifiedApp {
  track_id: string;
  name: string;
  seller_name: string;
  app_store_url: string;
  icon_url: string;
  description: string;
  primary_genre: string;
  rating: number;
  rating_count: number;
  is_verified: boolean;
}

export default function ClaimModal({
  isOpen,
  onClose,
  initialBid,
  initialApp,
  allApps,
}: ClaimModalProps) {
  const [query, setQuery] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifiedApp, setVerifiedApp] = useState<VerifiedApp | null>(null);

  const [productName, setProductName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [bidAmount, setBidAmount] = useState<number>(initialBid || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (initialBid) {
      setBidAmount(initialBid);
    }
  }, [initialBid]);

  useEffect(() => {
    if (initialApp) {
      setQuery(initialApp.app_store_url || initialApp.name);
      setVerifiedApp({
        track_id: String(initialApp.track_id),
        name: initialApp.name,
        seller_name: initialApp.seller_name,
        app_store_url: initialApp.app_store_url,
        icon_url: initialApp.icon_url,
        description: initialApp.description,
        primary_genre: initialApp.primary_genre,
        rating: initialApp.rating,
        rating_count: initialApp.rating_count,
        is_verified: true,
      });
      setProductName(initialApp.name);
      setWebsiteUrl(initialApp.app_store_url);
    }
  }, [initialApp]);

  if (!isOpen) return null;

  // Calculate rank dynamically based on existing bids
  const calculateRank = (bid: number) => {
    let rank = 1;
    for (const app of allApps) {
      if (verifiedApp && String(app.track_id) === String(verifiedApp.track_id)) {
        continue;
      }
      if (app.bid_amount >= bid) {
        rank++;
      }
    }
    return rank;
  };

  const currentRank = calculateRank(bidAmount);

  // Calculate minimum to claim rank 1
  const topApp = allApps.length > 0 ? allApps[0] : null;
  const minForRank1 = topApp ? Math.max(1, Math.round(topApp.bid_amount + 1)) : 1;

  const handleVerify = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setVerifyError("Please enter your Apple App Store URL");
      return;
    }

    const isAppStoreUrl = /^https?:\/\/(apps|itunes)\.apple\.com\/.+/i.test(trimmed) && /id\d{6,14}/i.test(trimmed);
    if (!isAppStoreUrl) {
      setVerifyError("Invalid URL. Only official Apple App Store URLs (https://apps.apple.com/...) are allowed.");
      return;
    }

    setIsVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/verify-ios-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      if (res.ok && data.verified && data.app) {
        setVerifiedApp(data.app);
        setProductName(data.app.name);
        setWebsiteUrl(data.app.app_store_url);
      } else {
        setVerifyError(data.detail || "Could not find iOS app on Apple App Store");
      }
    } catch {
      setVerifyError("Network error while connecting to Apple App Store");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetVerification = () => {
    setVerifiedApp(null);
    setProductName("");
    setWebsiteUrl("");
    setQuery("");
    setVerifyError("");
  };

  const handleBidIncrement = (step = 1) => {
    setBidAmount((prev) => prev + step);
  };

  const handleBidDecrement = () => {
    setBidAmount((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedApp) {
      setVerifyError("Please verify your iOS app first");
      return;
    }
    setIsSubmitting(true);
    setStatusMessage("Creating Dodo Payments secure checkout...");

    try {
      const payload = {
        track_id: verifiedApp.track_id,
        app_name: productName || verifiedApp.name,
        bid_amount: bidAmount,
        return_url: `${window.location.origin}/?payment=success`,
      };

      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const checkoutData = await res.json();

      if (res.ok && checkoutData.checkout_url) {
        setStatusMessage("Redirecting to Dodo Payments checkout...");
        window.location.href = checkoutData.checkout_url;
      } else {
        setVerifyError(checkoutData.detail || "Payment checkout creation failed");
        setIsSubmitting(false);
      }
    } catch {
      setVerifyError("Error connecting to payment provider");
      setIsSubmitting(false);
    }
  };

  const getRankBadgeContent = () => {
    if (currentRank === 1) {
      return (
        <div className="rank-badge-pill rank-gold">
          <span>👑</span>
          <span>Rank #1 (Leaderboard Champion)</span>
        </div>
      );
    }
    if (currentRank === 2) {
      return (
        <div className="rank-badge-pill rank-silver">
          <span>🥈</span>
          <span>Rank #2 (Podium Contender)</span>
        </div>
      );
    }
    if (currentRank === 3) {
      return (
        <div className="rank-badge-pill rank-bronze">
          <span>🥉</span>
          <span>Rank #3 (Podium Contender)</span>
        </div>
      );
    }
    return (
      <div className="rank-badge-pill rank-standard">
        <span>⚡</span>
        <span>Rank #{currentRank}</span>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-title-row">
              <h3 className="modal-title">List Your iOS App</h3>
              <span className="modal-badge-instant">Instant Activation</span>
            </div>
            <p className="modal-subtitle">
              Verify your app on the App Store, set your bid, and climb the leaderboard.
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmitPayment}>
          {/* Apple App Store Verification */}
          <div className="form-group">
            <label className="form-label">
              <span>Verify Apple App Store Listing</span>
              <span className="form-label-required">Required</span>
            </label>

            {!verifiedApp ? (
              <>
                <div className="input-with-action">
                  <input
                    type="text"
                    placeholder="https://apps.apple.com"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleVerify();
                      }
                    }}
                    className="text-input"
                  />
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="verify-action-btn"
                  >
                    {isVerifying ? "Verifying..." : "Verify App"}
                  </button>
                </div>
                {verifyError && (
                  <p className="field-hint" style={{ color: "#dc2626", fontWeight: 600 }}>
                    ⚠️ {verifyError}
                  </p>
                )}
                <p className="field-hint">
                  💡 Paste your official Apple App Store URL (e.g. https://apps.apple.com/app/...)
                </p>
              </>
            ) : (
              <div className="verified-card">
                <div className="verified-card-main">
                  {verifiedApp.icon_url && (
                    <Image
                      src={verifiedApp.icon_url}
                      alt={verifiedApp.name}
                      width={50}
                      height={50}
                      className="verified-icon"
                    />
                  )}
                  <div className="verified-details">
                    <h4>
                      <span>{verifiedApp.name}</span>
                      <span className="verified-check-icon">✓</span>
                    </h4>
                    <p>
                      <span>{verifiedApp.seller_name}</span>
                      <span>·</span>
                      <span className="verified-rating">★ {verifiedApp.rating}</span>
                      <span className="verified-tag">{verifiedApp.primary_genre}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetVerification}
                  className="change-app-btn"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Interactive Bid Card */}
          <div className="bid-calc-card">
            <div className="bid-calc-title">Your Bid &amp; Projected Rank</div>

            <div className="bid-calc-controls">
              <button
                type="button"
                onClick={handleBidDecrement}
                className="bid-adjuster-btn"
                aria-label="Decrease bid"
              >
                –
              </button>
              <div className="bid-calc-amount">${bidAmount}</div>
              <button
                type="button"
                onClick={() => handleBidIncrement(1)}
                className="bid-adjuster-btn"
                aria-label="Increase bid"
              >
                +
              </button>
            </div>

            {/* Quick preset chips */}
            <div className="quick-bid-pills">
              <button
                type="button"
                onClick={() => handleBidIncrement(1)}
                className="quick-bid-pill"
              >
                +$1
              </button>
              <button
                type="button"
                onClick={() => handleBidIncrement(5)}
                className="quick-bid-pill"
              >
                +$5
              </button>
              <button
                type="button"
                onClick={() => handleBidIncrement(10)}
                className="quick-bid-pill"
              >
                +$10
              </button>
              <button
                type="button"
                onClick={() => setBidAmount(minForRank1)}
                className="quick-bid-pill"
                style={{ background: "#fef3c7", borderColor: "#f59e0b", color: "#b45309" }}
              >
                👑 Claim #1 (${minForRank1})
              </button>
            </div>

            <div className="bid-calc-divider"></div>

            <div className="rank-result-label">Rank You Get</div>
            <div>{getRankBadgeContent()}</div>
          </div>

          {/* Status microcopy */}
          <div className="modal-notice-text">
            {statusMessage ||
              (!verifiedApp
                ? "Verify your iOS app above to unlock checkout."
                : currentRank === 1
                ? "🔥 Your bid will place you at the very top of Trendbit!"
                : currentRank <= 3
                ? "✨ Your bid places you on the coveted Top 3 podium!"
                : `⚡ You will rank #${currentRank} immediately after payment.`)}
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={!verifiedApp || isSubmitting}
            className="modal-submit-btn"
          >
            {isSubmitting ? (
              <span>Processing with Dodo Payments...</span>
            ) : verifiedApp ? (
              <span>Pay ${bidAmount} · Claim Rank #{currentRank} ➔</span>
            ) : (
              <span>Verify iOS App to Continue</span>
            )}
          </button>

          {/* Trust & Security Badge */}
          <div className="modal-footer-security">
            <span>🔒</span>
            <span>256-bit SSL encrypted · Payments securely processed by Dodo Payments</span>
          </div>
        </form>
      </div>
    </div>
  );
}
