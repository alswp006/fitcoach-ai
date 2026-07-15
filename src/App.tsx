import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import Home from './pages/Home';
import Profile from './pages/Profile';
import WorkoutDetail from './pages/WorkoutDetail';
import Coach from './pages/Coach';
import SessionSummary from './pages/SessionSummary';
import Report from './pages/Report';
import History from './pages/History';
import Premium from './pages/Premium';
import { AppStoreProvider } from './lib/store/AppStore';
import { AppToastProvider, useAppToast } from './components/AppToastProvider';
import { TossRewardAd } from './components/TossRewardAd';
import { installExternalNavigationGuard } from './lib/navigation/externalNavigationGuard';

// Dev-only TDS Gallery route — `import.meta.env.DEV` is statically replaced
// (true in dev, false in prod) so the entire import + Route is tree-shaken
// from production builds. Verify with: `grep -r "TdsGallery" dist/` → empty.
const DevTdsGallery = import.meta.env.DEV
  ? lazy(() => import('./pages/__TdsGallery'))
  : null;

function AppRoutes() {
  const { showToast } = useAppToast();

  // 외부 도메인 이탈 차단 가드 — window.open/location.href 시도 시 조용히 막고 안내.
  useEffect(() => {
    const uninstall = installExternalNavigationGuard(() => {
      showToast('앱 밖으로 이동할 수 없어요');
    });
    return uninstall;
  }, [showToast]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/workouts/:workoutId" element={<WorkoutDetail />} />
      <Route path="/coach" element={<Coach />} />
      <Route path="/session/summary" element={<SessionSummary />} />
      <Route
        path="/report"
        element={
          <TossRewardAd slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}>
            <Report />
          </TossRewardAd>
        }
      />
      <Route path="/history" element={<History />} />
      <Route path="/premium" element={<Premium />} />
      {DevTdsGallery && (
        <Route
          path="/__tds-gallery"
          element={
            <Suspense fallback={null}>
              <DevTdsGallery />
            </Suspense>
          }
        />
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <AppToastProvider>
        <AppRoutes />
      </AppToastProvider>
    </AppStoreProvider>
  );
}
