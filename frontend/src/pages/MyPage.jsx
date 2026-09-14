import { useCallback, useEffect, useState } from "react";
import { Heart, LogOut, MapPin, Pencil, Route, Save, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchFavorites, fetchSavedCourses, removeFavorite, removeSavedCourse } from "../api/memberApi";

export default function MyPage() {
  const { user, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ nickname: user.nickname, email: user.email });
  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [favoriteData, courseData] = await Promise.all([fetchFavorites(), fetchSavedCourses()]);
      setFavorites(favoriteData);
      setCourses(courseData);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "마이페이지 정보를 불러오지 못했습니다.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function logout() {
    await signOut();
    navigate("/");
  }

  async function saveProfile(event) {
    event.preventDefault();
    setProfileMessage("");
    setSavingProfile(true);
    try {
      await updateProfile(profileForm);
      setEditing(false);
      setProfileMessage("회원 정보를 수정했습니다.");
    } catch (requestError) {
      setProfileMessage(requestError.response?.data?.message || "회원 정보를 수정하지 못했습니다.");
    } finally { setSavingProfile(false); }
  }

  return (
    <div className="page">
      <section className="profile-hero">
        <div className="profile-avatar">{user.nickname.slice(0, 1).toUpperCase()}</div>
        <div className="profile-heading"><span className="eyebrow">MY LOCAL:ON</span><h1>{user.nickname}님의 여행 보관함</h1>{profileMessage && <small className="profile-message">{profileMessage}</small>}</div>
        <div className="profile-actions">
          <button className="secondary-button" type="button" onClick={() => { setEditing(!editing); setProfileMessage(""); setProfileForm({ nickname: user.nickname, email: user.email }); }}>{editing ? <X size={17} /> : <Pencil size={17} />}{editing ? "취소" : "정보 수정"}</button>
          <button className="secondary-button" type="button" onClick={logout}><LogOut size={17} /> 로그아웃</button>
        </div>
      </section>

      {editing && (
        <form className="profile-edit-panel" onSubmit={saveProfile}>
          <label>닉네임<input required maxLength="30" value={profileForm.nickname} onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })} /></label>
          <label>이메일<input required type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} /></label>
          <button className="primary-button" disabled={savingProfile}><Save size={17} />{savingProfile ? "저장 중..." : "변경사항 저장"}</button>
        </form>
      )}

      {loading && <div className="status-banner">저장한 여행 정보를 불러오는 중입니다.</div>}
      {error && <div className="status-banner warning">{error}</div>}

      <div className="mypage-grid">
        <section className="panel">
          <div className="panel-head"><div><span className="section-kicker">FAVORITES</span><h2>찜한 장소</h2></div><span className="count-badge">{favorites.length}</span></div>
          <div className="saved-list">
            {favorites.map((place) => (
              <div className="saved-row" key={place.id}>
                <button type="button" className="saved-main" onClick={() => navigate(`/places/${place.id}`)}><Heart size={18} /><span><strong>{place.name}</strong><small><MapPin size={12} /> {place.address}</small></span></button>
                <button className="icon-button" aria-label={`${place.name} 즐겨찾기 삭제`} onClick={async () => { await removeFavorite(place.id); refresh(); }}><Trash2 size={16} /></button>
              </div>
            ))}
            {!loading && favorites.length === 0 && <div className="empty-card">장소 상세에서 하트를 눌러 관심 장소를 모아보세요.</div>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><div><span className="section-kicker">SAVED COURSES</span><h2>저장한 코스</h2></div><span className="count-badge">{courses.length}</span></div>
          <div className="saved-list">
            {courses.map((course) => (
              <div className="saved-row" key={course.id}>
                <div className="saved-main static"><Route size={18} /><span><strong>{course.title}</strong><small>{course.regionName} · 로컬 {course.localRatio}% · 장소 {course.placeIds.length}곳</small></span></div>
                <button className="icon-button" aria-label={`${course.title} 삭제`} onClick={async () => { await removeSavedCourse(course.id); refresh(); }}><Trash2 size={16} /></button>
              </div>
            ))}
            {!loading && courses.length === 0 && <div className="empty-card">추천 코스를 만든 후 저장해보세요.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
