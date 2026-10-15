"use client";

import React from "react";

interface HeroProps {
  topBidPrice: number;
  selectedBid: number;
  onBidChange: (newBid: number) => void;
  onOpenModal: () => void;
}

export default function Hero({
  topBidPrice,
  selectedBid,
  onBidChange,
  onOpenModal,
}: HeroProps) {
  const handleDecrement = () => {
    if (selectedBid > 1) {
      onBidChange(selectedBid - 1);
    }
  };

  const handleIncrement = () => {
    onBidChange(selectedBid + 1);
  };

  return (
    <section className="hero-section">
      <h1 className="hero-title">
        Pay to climb for rank your ios app.
      </h1>
      <p className="hero-subtitle">
        No ads, no algorithms, no bias. Your bid decides your rank — and every
        listed iOS app gets direct App Store traffic and a free do-follow crawlable backlink.
      </p>

      <div className="hero-bid-widget">
        <span>Claim #1 for</span>
        <button
          type="button"
          onClick={handleDecrement}
          className="bid-adjuster-btn"
          aria-label="Decrease bid"
        >
          –
        </button>
        <span className="bid-amount-highlight">${selectedBid}</span>
        <button
          type="button"
          onClick={handleIncrement}
          className="bid-adjuster-btn"
          aria-label="Increase bid"
        >
          +
        </button>
      </div>

      <div>
        <button
          type="button"
          onClick={onOpenModal}
          className="claim-rank-primary-btn"
        >
          Claim your rank
        </button>
      </div>
    </section>
  );
}
