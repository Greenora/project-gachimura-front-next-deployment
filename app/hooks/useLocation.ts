"use client";

import { useState, useEffect, useCallback } from "react";
import { clientFetch } from "./useClientFetch";
import { toast } from "react-hot-toast";
import { useLanguage } from "./LanguageContext";

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
  const { texts } = useLanguage();
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

        console.log("Geolocation success:", { latitude, longitude });

        const processLocation = (retryCount = 0) => {
          console.log(`Checking window.kakao (attempt ${retryCount + 1}):`, {
            hasKakao: !!window.kakao,
            hasMaps: window.kakao ? !!window.kakao.maps : false
          });

          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
              const geocoder = new window.kakao.maps.services.Geocoder();

              geocoder.coord2RegionCode(longitude, latitude, (result: any, status: any) => {
                console.log("Geocoder result:", status, result);
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

                    if (!isAuto) {
                      const successMsg = texts.main.locationSuccess
                        .replace("{region}", region)
                        .replace("{district}", district);
                      toast.success(successMsg);
                    }
                  }
                } else {
                  console.warn("Geocoder failed status:", status);
                  setLocation(prev => ({ ...prev, latitude, longitude, isLoading: false }));
                  syncLocationWithBackend(latitude, longitude);
                  if (!isAuto) toast.success(texts.main.locationCoordsSuccess);
                }
              });
            });
          } else if (retryCount < 10) {
            // 카카오 지도 스크립트가 아직 로딩되지 않았을 가능성이 높으므로 0.5초 후 재시도
            setTimeout(() => processLocation(retryCount + 1), 500);
          } else {
            console.warn("Kakao maps SDK not loaded correctly after retries. window.kakao:", window.kakao);
            setLocation(prev => ({ ...prev, latitude, longitude, isLoading: false }));
            syncLocationWithBackend(latitude, longitude);
            if (!isAuto) toast.success(texts.main.locationCoordsSuccess);
          }
        };

        // 위치 처리를 시작
        processLocation();
      },
      (error) => {
        let msg = texts.main.locationError;
        let description = "";

        if (error.code === 1) {
          msg = texts.main.locationPermissionDenied;
          description = texts.main.locationPermissionGuide;
        } else if (error.code === 3) {
          msg = texts.main.locationTimeout;
        }

        setLocation(prev => ({ ...prev, isLoading: false, error: msg }));

        if (!isAuto) {
          if (error.code === 1) {
            toast.error(`${msg}\n${description}`, {
              duration: 6000,
              style: {
                minWidth: '300px',
                fontSize: '14px',
                lineHeight: '1.5',
              },
            });
          } else {
            toast.error(msg);
          }
        }
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
