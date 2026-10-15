"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface HeaderProps {
  activeUsers: number;
  totalVisitors: number;
}

export default function Header({ activeUsers, totalVisitors }: HeaderProps) {
  return (
    <header className="site-header">
      <Link href="/" className="brand-container">
        <Image
          src="/logo.png"
          alt="Trendbit Logo"
          width={36}
          height={36}
          className="brand-logo-img"
          priority
        />
        <span className="brand-name">Trendbit</span>
        <span className="brand-badge">iOS</span>
      </Link>

      <div className="stats-pill">
        <span className="stats-visitors-label">
          <strong>{totalVisitors.toLocaleString()}</strong>
          <span className="label-desktop"> visitors from beginning</span>
          <span className="label-mobile"> visits</span>
        </span>
        <span className="divider">|</span>
        <span className="live-indicator">
          <span className="pulse-dot"></span>
          <strong>{activeUsers}</strong>
          <span className="label-desktop"> live active</span>
          <span className="label-mobile"> live</span>
        </span>
      </div>
    </header>
  );
}
