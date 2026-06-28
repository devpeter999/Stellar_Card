// Dynamic import wrappers for heavy components. Next.js code-splits
// at the dynamic() boundary so these only load when their parent
// route renders. The `ssr: false` flag skips server rendering for
// components that depend on browser APIs (window, pointer events,
// requestAnimationFrame).

'use client';

import dynamic from 'next/dynamic';
import { LoadingState } from '../components/LoadingState';

export const DynamicHeroCard = dynamic(
  () => import('../components/HeroCard').then((mod) => mod.HeroCard),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <LoadingState>Loading card…</LoadingState>
      </div>
    ),
  }
);

export const DynamicHeroScene = dynamic(
  () => import('../components/HeroCard').then((mod) => mod.HeroScene),
  { ssr: false }
);

export const DynamicSpendChart = dynamic(
  () => import('../dashboard/_ui/SpendChart').then((mod) => mod.SpendChart),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingState> Loading chart…</LoadingState>
      </div>
    ),
  }
);

export const DynamicQrCode = dynamic(
  () => import('../dashboard/_ui/QrCode').then((mod) => mod.QrCode),
  { ssr: false }
);
