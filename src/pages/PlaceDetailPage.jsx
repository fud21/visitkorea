import { ArrowLeft, Heart, MapPin, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { placeDetail } from "../data/mockData";

export default function PlaceDetailPage() {
  const navigate = useNavigate();
  const place = placeDetail;

  return (
    <div className="page">
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
        <button className="secondary-button" type="button"><Heart size={18}/> 즐겨찾기</button>
        <button className="primary-button" type="button"><Plus size={18}/> 이 장소를 코스에 추가</button>
      </div>
    </div>
  );
}
