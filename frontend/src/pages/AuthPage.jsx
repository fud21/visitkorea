import { useState } from "react";
import { ArrowRight, Compass } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", nickname: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, authenticate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from || { pathname: "/mypage" };

  if (user) return <Navigate to="/mypage" replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authenticate(mode, form);
      navigate(destination.pathname, { replace: true, state: destination.state });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "요청을 처리하지 못했습니다. 입력 내용을 확인해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page auth-page">
      <section className="auth-card">
        <div className="auth-intro">
          <Compass size={30} />
          <span className="eyebrow">LOCAL:ON MEMBER</span>
          <h1>{mode === "login" ? "다시 여행을 이어가세요." : "나만의 로컬 여행을 시작하세요."}</h1>
          <p>관심 장소와 추천 코스를 저장하고 마이페이지에서 다시 확인할 수 있습니다.</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="auth-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>로그인</button>
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>회원가입</button>
          </div>
          {mode === "signup" && (
            <label>닉네임<input required maxLength="30" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="여행자 이름" /></label>
          )}
          <label>이메일<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
          <label>비밀번호<input required type="password" minLength={mode === "signup" ? 8 : undefined} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={mode === "signup" ? "8자 이상" : "비밀번호"} /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary-button full" disabled={submitting}>
            {submitting ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}<ArrowRight size={17} />
          </button>
        </form>
      </section>
    </div>
  );
}
