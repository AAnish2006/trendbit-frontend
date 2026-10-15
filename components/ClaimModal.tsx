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
  const [bidAmount, setBidAmount] = useState<number>(initialBid || 9);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showHowRankingWorks, setShowHowRankingWorks] = useState(false);

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

    const isAppStoreUrl =
      /^https?:\/\/(apps|itunes)\.apple\.com\/.+/i.test(trimmed) &&
      /id\d{6,14}/i.test(trimmed);
    if (!isAppStoreUrl) {
      setVerifyError(
        "Invalid URL. Only official Apple App Store URLs (https://apps.apple.com/...) are allowed."
      );
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
      if (query.trim()) {
        await handleVerify();
      } else {
        setVerifyError("Please paste and verify your Apple App Store URL first");
      }
      return;
    }

    setIsSubmitting(true);
    setVerifyError("");
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
        setStatusMessage("");
        setVerifyError(checkoutData.detail || "Payment checkout creation failed");
        setIsSubmitting(false);
      }
    } catch {
      setStatusMessage("");
      setVerifyError("Error connecting to payment provider");
      setIsSubmitting(false);
    }
  };

  const renderRankProjectionBadge = () => {
    if (currentRank === 1) {
      return (
        <div className="rank-project-pill rank-project-gold">
          <span className="rank-project-emoji">👑</span>
          <span className="rank-project-text">Rank #1 (Leaderboard Champion)</span>
        </div>
      );
    }
    if (currentRank === 2) {
      return (
        <div className="rank-project-pill rank-project-silver">
          <span className="rank-project-emoji">🥈</span>
          <span className="rank-project-text">Rank #2 (Podium Contender)</span>
        </div>
      );
    }
    if (currentRank === 3) {
      return (
        <div className="rank-project-pill rank-project-bronze">
          <span className="rank-project-emoji">🥉</span>
          <span className="rank-project-text">Rank #3 (Podium Contender)</span>
        </div>
      );
    }
    return (
      <div className="rank-project-pill rank-project-standard">
        <span className="rank-project-emoji">⚡</span>
        <span className="rank-project-text">Rank #{currentRank}</span>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-app-store-icon-wrapper">
              <Image
                src="/app-store-icon.png"
                alt="Apple App Store"
                width={56}
                height={56}
                priority
                className="modal-app-store-icon"
              />
            </div>
            <div className="modal-title-group">
              <div className="modal-title-row">
                <h3 className="modal-title">List Your iOS App</h3>
                <span className="modal-badge-instant">
                  <span className="instant-bolt">⚡</span> INSTANT ACTIVATION
                </span>
              </div>
              <p className="modal-subtitle">
                Verify your app on the App Store, set your bid, and compete on the leaderboard.
              </p>
            </div>
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
          {/* STEP 1: Verify Apple App Store Listing */}
          <div className="modal-step-section">
            <div className="modal-step-header">
              <div className="modal-step-title-row">
                <span className="step-num step-blue">1</span>
                <span className="step-title">Verify Apple App Store Listing</span>
              </div>
              <span className="step-badge-required">Required</span>
            </div>

            {!verifiedApp ? (
              <div className="step1-input-container">
                <div className="step1-input-box">
                  <span className="step1-link-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </span>
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
                    className="step1-input-field"
                  />
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="step1-verify-btn"
                  >
                    {isVerifying ? "Verifying..." : "Verify App →"}
                  </button>
                </div>

                {verifyError && (
                  <p className="step1-error-text">⚠️ {verifyError}</p>
                )}

                <div className="step1-info-callout">
                  <span className="step1-lightbulb">💡</span>
                  <div className="step1-info-content">
                    <div className="step1-info-heading">
                      Paste your official Apple App Store URL
                    </div>
                    <div className="step1-info-sub">
                      e.g. https://apps.apple.com/app/your-app-id
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="verified-app-banner">
                <div className="verified-app-main">
                  {verifiedApp.icon_url && (
                    <Image
                      src={verifiedApp.icon_url}
                      alt={verifiedApp.name}
                      width={48}
                      height={48}
                      className="verified-app-logo"
                    />
                  )}
                  <div className="verified-app-meta">
                    <div className="verified-app-title-line">
                      <span className="verified-app-name">{verifiedApp.name}</span>
                      <span className="verified-badge-check">✓</span>
                    </div>
                    <div className="verified-app-sub">
                      <span>{verifiedApp.seller_name}</span>
                      <span>•</span>
                      <span className="verified-star">★ {verifiedApp.rating}</span>
                      <span className="verified-genre">{verifiedApp.primary_genre}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetVerification}
                  className="verified-change-link"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: Your Bid & Projected Rank */}
          <div className="modal-step-section step2-card">
            <div className="modal-step-header">
              <div className="modal-step-title-row">
                <span className="step-num step-orange">2</span>
                <span className="step-title">Your Bid &amp; Projected Rank</span>
              </div>
              <button
                type="button"
                className="step-info-pill-btn"
                onClick={() => setShowHowRankingWorks((prev) => !prev)}
              >
                <span>ⓘ</span>
                <span>How ranking works?</span>
              </button>
            </div>

            {showHowRankingWorks && (
              <div className="ranking-works-explainer">
                <strong>How Trendbit Leaderboard Ranking Works:</strong>
                <ul>
                  <li>Rank is strictly ordered by active bid amount (highest bid = #1).</li>
                  <li>Outbid by \$1+ to immediately overtake any spot.</li>
                  <li>All rankings, visits, and clicks sync instantly in real-time.</li>
                </ul>
              </div>
            )}

            {/* Central Bid Controller */}
            <div className="bid-controller-center">
              <button
                type="button"
                onClick={handleBidDecrement}
                className="bid-round-btn"
                aria-label="Decrease bid"
              >
                −
              </button>
              <div className="bid-big-amount">${bidAmount}</div>
              <button
                type="button"
                onClick={() => handleBidIncrement(1)}
                className="bid-round-btn"
                aria-label="Increase bid"
              >
                +
              </button>
            </div>

            {/* Quick Increment Chips */}
            <div className="quick-chips-row">
              <button
                type="button"
                onClick={() => handleBidIncrement(1)}
                className="quick-chip"
              >
                +$1
              </button>
              <button
                type="button"
                onClick={() => handleBidIncrement(5)}
                className="quick-chip"
              >
                +$5
              </button>
              <button
                type="button"
                onClick={() => handleBidIncrement(10)}
                className="quick-chip"
              >
                +$10
              </button>
              <button
                type="button"
                onClick={() => setBidAmount(minForRank1)}
                className="quick-chip quick-chip-claim"
              >
                <span className="chip-crown">👑</span> Claim #1 (${minForRank1})
              </button>
            </div>

            {/* Rank You Get Projection Badge */}
            <div className="rank-projection-area">
              <div className="rank-projection-label">
                <span className="rank-proj-chart">📈</span>
                <span>RANK YOU GET</span>
              </div>
              <div className="rank-projection-pill-wrap">
                {renderRankProjectionBadge()}
              </div>
            </div>
          </div>

          {/* 3-Column Trust / Value Proposition Strip */}
          <div className="modal-value-strip">
            <div className="value-col">
              <div className="value-icon">🏆</div>
              <div className="value-text">
                <div className="value-title">Boost Visibility</div>
                <div className="value-sub">Get more users</div>
              </div>
            </div>
            <div className="value-divider" />
            <div className="value-col">
              <div className="value-icon">📊</div>
              <div className="value-text">
                <div className="value-title">Real-time Ranking</div>
                <div className="value-sub">See your position</div>
              </div>
            </div>
            <div className="value-divider" />
            <div className="value-col">
              <div className="value-icon">⚡</div>
              <div className="value-text">
                <div className="value-title">Instant Activation</div>
                <div className="value-sub">Live after payment</div>
              </div>
            </div>
          </div>

          {/* Status and Error notices */}
          {statusMessage && (
            <div className="modal-status-text">{statusMessage}</div>
          )}
          {verifyError && (
            <div className="modal-error-text">⚠️ {verifyError}</div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="modal-primary-action-btn"
          >
            {isSubmitting ? (
              <span>Processing with Dodo Payments...</span>
            ) : verifiedApp ? (
              <span>🔒 Pay ${bidAmount} &amp; Claim Rank #{currentRank} →</span>
            ) : (
              <span>🔒 Verify iOS App &amp; Continue →</span>
            )}
          </button>

          {/* Footer Security Microcopy */}
          <div className="modal-security-text">
            <span>🔒 256-bit SSL encrypted • Payments securely processed by Dodo Payments</span>
          </div>

          {/* Payment Provider Badges */}
          <div className="modal-payment-badges-row">
            <div className="payment-badge-dodo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0d9488">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
              </svg>
              <span>Dodo Payments</span>
            </div>
            <span className="badge-pipe">|</span>
            <div className="payment-badge-visa">VISA</div>
            <div className="payment-badge-mastercard">
              <span className="mc-red" />
              <span className="mc-orange" />
            </div>
            <div className="payment-badge-upi">
              <span>UPI</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#16a34a">
                <polygon points="0,0 24,12 0,24" />
              </svg>
            </div>
            <div className="payment-badge-pci">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
              <span>PCI DSS COMPLIANT</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
