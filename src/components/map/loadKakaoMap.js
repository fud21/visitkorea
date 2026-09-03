let kakaoMapPromise = null;

export function loadKakaoMap() {
  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao);
  }

  if (kakaoMapPromise) {
    return kakaoMapPromise;
  }

  kakaoMapPromise = new Promise((resolve, reject) => {
    const appKey = import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY;

    if (!appKey) {
      reject(
        new Error(
          "VITE_KAKAO_MAP_JAVASCRIPT_KEY가 설정되지 않았습니다."
        )
      );
      return;
    }

    const script = document.createElement("script");

    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;

    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        resolve(window.kakao);
      });
    };

    script.onerror = () => {
      reject(new Error("Kakao Map SDK 로딩에 실패했습니다."));
    };

    document.head.appendChild(script);
  });

  return kakaoMapPromise;
}