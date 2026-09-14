import { ArrowLeft, Heart, MapPin, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { placeDetail } from "../data/mockData";
import { fetchPlace } from "../api/tourismApi";
import { useApiResource } from "../hooks/useApiResource";
import { addFavorite } from "../api/memberApi";
import { useAuth } from "../auth/AuthContext";
import { useState } from "react";

export default function PlaceDetailPage() {
  const navigate = useNavigate();
  const { placeId } = useParams();
  const { user } = useAuth();
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const resource = useApiResource(() => fetchPlace(placeId), [placeId], placeDetail);
  const place = { ...placeDetail, ...resource.data, localBadge: resource.data.sampleData ? "샘플 데이터" : "현지인 추천" };

  async function favorite() {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/places/${placeId}` } } });
      return;
    }
    try {
      await addFavorite(placeId);
      setFavoriteMessage("즐겨찾기에 저장했습니다.");
    } catch (error) {
      setFavoriteMessage(error.response?.data?.message || "즐겨찾기에 저장하지 못했습니다.");
    }
  }

  return (
    <div className="page">
      {resource.loading && <div className="status-banner">장소 정보를 불러오는 중입니다.</div>}
      {resource.usingFallback && <div className="status-banner warning">백엔드에 연결할 수 없어 데모 데이터를 표시합니다.</div>}
      <button className="back-button" type="button" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> 코스로 돌아가기
      </button>

      <section className="place-hero">
        <div>
          <div className="tag-row">
            <span className="tag">{place.category}</span>
            <span className="tag green">{place.localBadge}</span>
          </div>
          <h1>{place.name}</h1>
          <p><MapPin size={16} /> {place.address}</p>
        </div>
        <div className="place-score-card">
          <span>Local Score</span>
          <strong>{place.localScore}</strong>
          <small>점</small>
        </div>
      </section>

      <div className="place-image-grid">
        <div className="image-placeholder large">시장 대표 이미지</div>
        <div className="image-placeholder">먹거리 이미지</div>
      </div>

      <div className="analysis-grid">
        <section className="panel">
          <span className="section-kicker">AI 추천 이유</span>
          <h2>왜 이 장소를 넣었을까요?</h2>
          <p className="body-copy">{place.description}</p>
          <ul className="reason-list">
            {place.reasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        </section>

        <section className="panel">
          <span className="section-kicker">기본 정보</span>
          <h2>방문 정보</h2>
          <dl className="info-list">
            <div><dt>운영시간</dt><dd>{place.hours}</dd></div>
            <div><dt>휴무</dt><dd>{place.closed}</dd></div>
            <div><dt>주차</dt><dd>{place.parking}</dd></div>
          </dl>
        </section>
      </div>

      <div className="bottom-action-bar">
        {favoriteMessage && <span className="action-message">{favoriteMessage}</span>}
        <button className="secondary-button" type="button" onClick={favorite}><Heart size={18}/> 즐겨찾기</button>
        <button className="primary-button" type="button"><Plus size={18}/> 이 장소를 코스에 추가</button>
      </div>
    </div>
  );
}
