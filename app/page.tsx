import LeaderboardView from "../components/LeaderboardView";

// Incremental Static Regeneration (ISR) with 30s background revalidation
export const revalidate = 30;

async function getInitialLeaderboard() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/leaderboard?page=1&limit=15", {
      next: { revalidate: 30 },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Could not pre-render leaderboard from FastAPI (will hydrate on client):", err);
  }
  return {
    apps: [],
    total_items: 0,
    total_pages: 1,
    claim_rank_1_price: 1,
  };
}

async function getInitialStats() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/stats", {
      next: { revalidate: 30 },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Could not pre-render stats from FastAPI:", err);
  }
  return {
    active_users: 0,
    total_visitors: 0,
  };
}

export default async function HomePage() {
  const [leaderboardData, statsData] = await Promise.all([
    getInitialLeaderboard(),
    getInitialStats(),
  ]);

  const initialData = {
    apps: leaderboardData.apps || [],
    total_items: leaderboardData.total_items || 0,
    total_pages: leaderboardData.total_pages || 0,
    claim_rank_1_price: leaderboardData.claim_rank_1_price || 1,
    active_users: statsData.active_users || 0,
    total_visitors: statsData.total_visitors || 0,
  };

  return <LeaderboardView initialData={initialData} />;
}
