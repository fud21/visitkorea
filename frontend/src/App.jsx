import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout
  from "./components/layout/AppLayout";

import HomePage
  from "./pages/HomePage";

import MapExplorePage
  from "./pages/MapExplorePage";

import RegionDiscoveryPage
  from "./pages/RegionDiscoveryPage";

import RegionPage
  from "./pages/RegionPage";

import CourseSetupPage
  from "./pages/CourseSetupPage";

import CourseResultPage
  from "./pages/CourseResultPage";

import PlaceDetailPage
  from "./pages/PlaceDetailPage";
import AuthPage from "./pages/AuthPage";
import MyPage from "./pages/MyPage";
import ProtectedRoute from "./auth/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/map"
          element={<MapExplorePage />}
        />

        <Route
          path="/discover"
          element={<RegionDiscoveryPage />}
        />

        <Route
          path="/region/:regionId"
          element={<RegionPage />}
        />

        <Route
          path="/course/setup/:regionId"
          element={<CourseSetupPage />}
        />

        <Route
          path="/course/setup"
          element={<CourseSetupPage />}
        />

        <Route
          path="/course/result"
          element={<CourseResultPage />}
        />

        <Route
          path="/places/:placeId"
          element={<PlaceDetailPage />}
        />

        <Route path="/login" element={<AuthPage />} />
        <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}
