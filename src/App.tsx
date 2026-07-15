import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Home from './pages/Home';
import Profile from './pages/Profile';
import WorkoutDetail from './pages/WorkoutDetail';
import Report from './pages/Report';
import History from './pages/History';
import { AppStoreProvider } from './lib/store/AppStore';
import { AppToastProvider } from './components/AppToastProvider';

// Dev-only TDS Gallery route — `import.meta.env.DEV` is statically replaced
// (true in dev, false in prod) so the entire import + Route is tree-shaken
// from production builds. Verify with: `grep -r "TdsGallery" dist/` → empty.
const DevTdsGallery = import.meta.env.DEV
  ? lazy(() => import('./pages/__TdsGallery'))
  : null;

export default function App() {
  return (
    <AppStoreProvider>
      <AppToastProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/workouts/:workoutId" element={<WorkoutDetail />} />
          <Route path="/report" element={<Report />} />
          <Route path="/history" element={<History />} />
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
      </AppToastProvider>
    </AppStoreProvider>
  );
}
