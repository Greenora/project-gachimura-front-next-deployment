"use client";

import { useState, useEffect, useCallback } from "react";
import { clientFetch } from "./useClientFetch";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  region: string | null; // 예: 대구광역시
  district: string | null; // 예: 수성구
  isLoading: boolean;
  error: string | null;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    region: null,
    district: null,
    isLoading: true,
    error: null,
  });

  const syncLocationWithBackend = useCallback(async (lat: number, lon: number, region?: string, district?: string) => {
    // 로그인한 유저만 서버에 좌표를 저장하도록 체크
    const hasToken = typeof document !== 'undefined' && document.cookie.includes("accessToken");
    if (!hasToken) return;

    try {
      await clientFetch("/users/profile", {
        method: "PATCH",
        body: {
          latitude: lat,
          longitude: lon,
          region,
          district,
        },
      });
    } catch (err: any) {
      // 401 에러(인증 만료 등) 시에는 콘솔 에러를 출력하지 않음
      if (err.message !== "Unauthorized") {
        console.error("Failed to sync location with backend", err);
      }
    }
  }, []);

  const updateLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, isLoading: false, error: "Geolocation not supported" }));
      return;
    }

    setLocation(prev => ({ ...prev, isLoading: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // 카카오 지도 API를 이용한 역지오코딩
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
            const geocoder = new window.kakao.maps.services.Geocoder();

            geocoder.coord2RegionCode(longitude, latitude, (result: any, status: any) => {
              if (status === window.kakao.maps.services.Status.OK) {
                // 시/도 (region_1depth_name), 구/군 (region_2depth_name) 추출
                const regionInfo = result.find((res: any) => res.region_type === "H"); // 행정동 기준
                if (regionInfo) {
                  const region = regionInfo.region_1depth_name;
                  const district = regionInfo.region_2depth_name;

                  const newState = {
                    latitude,
                    longitude,
                    region,
                    district,
                    isLoading: false,
                    error: null,
                  };

                  setLocation(newState);

                  // 백엔드와 동기화
                  syncLocationWithBackend(latitude, longitude, region, district);

                  // 로컬 스토리지에 캐시
                  localStorage.setItem("userLocation", JSON.stringify(newState));
                }
              } else {
                setLocation(prev => ({ ...prev, latitude, longitude, isLoading: false }));
                syncLocationWithBackend(latitude, longitude);
              }
            });
          });
        } else {
          setLocation(prev => ({ ...prev, latitude, longitude, isLoading: false }));
          syncLocationWithBackend(latitude, longitude);
        }
      },
      (error) => {
        setLocation(prev => ({ ...prev, isLoading: false, error: error.message }));
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [syncLocationWithBackend]);

  useEffect(() => {
    // 1. 먼저 로컬 스토리지에서 캐시된 정보를 불러옴
    const cached = localStorage.getItem("userLocation");
    if (cached) {
      const parsed = JSON.parse(cached);
      setLocation({
        ...parsed,
        isLoading: false,
        error: null,
      });
    }

    // 2. 실제 위치 업데이트 시도
    updateLocation();
  }, [updateLocation]);

  return { ...location, updateLocation };
}
