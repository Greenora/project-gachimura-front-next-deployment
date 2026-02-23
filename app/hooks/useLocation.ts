"use client";

import { useState, useEffect, useCallback } from "react";
import { clientFetch } from "./useClientFetch";
import { toast } from "react-hot-toast";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  district: string | null;
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
      if (err.message !== "Unauthorized") {
        console.error("Failed to sync location with backend", err);
      }
    }
  }, []);

  const updateLocation = useCallback((isAuto = false) => {
    if (!navigator.geolocation) {
      const errorMsg = "이 브라우저에서는 위치 정보를 사용할 수 없습니다.";
      setLocation(prev => ({ ...prev, isLoading: false, error: errorMsg }));
      if (!isAuto) toast.error(errorMsg);
      return;
    }

    setLocation(prev => ({ ...prev, isLoading: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
            const geocoder = new window.kakao.maps.services.Geocoder();

            geocoder.coord2RegionCode(longitude, latitude, (result: any, status: any) => {
              if (status === window.kakao.maps.services.Status.OK) {
                const regionInfo = result.find((res: any) => res.region_type === "H");
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
                  syncLocationWithBackend(latitude, longitude, region, district);
                  localStorage.setItem("userLocation", JSON.stringify(newState));

                  if (!isAuto) toast.success(`현재 위치(${region} ${district})로 업데이트되었습니다.`);
                }
              } else {
                setLocation(prev => ({ ...prev, latitude, longitude, isLoading: false }));
                syncLocationWithBackend(latitude, longitude);
                if (!isAuto) toast.success("위치 좌표가 업데이트되었습니다.");
              }
            });
          });
        } else {
          setLocation(prev => ({ ...prev, latitude, longitude, isLoading: false }));
          syncLocationWithBackend(latitude, longitude);
          if (!isAuto) toast.success("위치 좌표가 업데이트되었습니다.");
        }
      },
      (error) => {
        let msg = "위치 정보를 가져오는 데 실패했습니다.";
        if (error.code === 1) msg = "위치 정보 권한이 거부되었습니다.";
        else if (error.code === 3) msg = "위치 측정 시간이 초과되었습니다.";

        setLocation(prev => ({ ...prev, isLoading: false, error: msg }));
        if (!isAuto) toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [syncLocationWithBackend]);

  useEffect(() => {
    const cached = localStorage.getItem("userLocation");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setLocation({
          ...parsed,
          isLoading: false,
          error: null,
        });
      } catch (e) {
        localStorage.removeItem("userLocation");
      }
    }

    // 마운트 시에는 자동 업데이트임을 표시
    updateLocation(true);
  }, [updateLocation]);

  return { ...location, updateLocation: () => updateLocation(false) };
}
