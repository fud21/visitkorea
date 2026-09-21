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

    const existingScript = document.querySelector(
      'script[data-kakao-map-sdk="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (!window.kakao?.maps) {
          reject(new Error("Kakao Map 객체를 찾을 수 없습니다."));
          return;
        }

        window.kakao.maps.load(() => {
          resolve(window.kakao);
        });
      });

      existingScript.addEventListener("error", () => {
        reject(new Error("Kakao Map SDK 로딩에 실패했습니다."));
      });

      return;
    }

    const script = document.createElement("script");

    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;

    script.async = true;
    script.dataset.kakaoMapSdk = "true";

    script.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error("Kakao Map 객체를 찾을 수 없습니다."));
        return;
      }

      window.kakao.maps.load(() => {
        resolve(window.kakao);
      });
    };

    script.onerror = () => {
      kakaoMapPromise = null;
      reject(new Error("Kakao Map SDK 로딩에 실패했습니다."));
    };

    document.head.appendChild(script);
  });

  return kakaoMapPromise;
}