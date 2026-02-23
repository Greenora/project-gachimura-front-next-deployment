"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import PartyCard from "./PartyCard";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { Spinner } from "../common/Icons";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { useLocation } from "@/app/hooks/useLocation";

// 하버사인 공식: 두 좌표 간의 직선 거리(km) 계산
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function PartyList() {
  const [parties, setParties] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const searchParams = useSearchParams();
  const { texts } = useLanguage();
  const { latitude, longitude, isLoading: isLocationLoading } = useLocation();

  const search = searchParams.get("search");
  const filter = searchParams.get("filter") || "latest";
  const completed = searchParams.get("completed") || "true";

  useEffect(() => {
    const fetchParties = async () => {
      setFetching(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (filter) params.append("sort", filter);
        if (completed) params.append("completed", completed);

        const data = await clientFetch(`/parties?${params.toString()}`);
        setParties(data);
      } catch (error) {
        console.error("Failed to fetch parties:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchParties();
  }, [search, filter, completed]);

  // 거리 계산 및 파티 분류
  const { nearby, far } = useMemo(() => {
    if (!latitude || !longitude || parties.length === 0) {
      return { nearby: parties, far: [] };
    }

    const nearbyList: any[] = [];
    const farList: any[] = [];

    parties.forEach((party) => {
      if (party.latitude && party.longitude) {
        const dist = getDistance(
          latitude,
          longitude,
          parseFloat(party.latitude),
          parseFloat(party.longitude)
        );
        if (dist <= 10) {
          nearbyList.push({ ...party, distance: dist });
        } else {
          farList.push({ ...party, distance: dist });
        }
      } else {
        // 좌표 정보가 없는 경우 '먼 곳'으로 분류하거나 기본 목록에 포함
        farList.push(party);
      }
    });

    // 서버에서 이미 정렬된 순서(최신순/임박순)를 유지하기 위해 별도의 거리순 정렬 로직은 제거합니다.
    // 사용자가 명시적으로 정렬 필터를 선택했으므로 그 의도를 우선합니다.

    return { nearby: nearbyList, far: farList };
  }, [parties, latitude, longitude]);

  if (fetching || isLocationLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Spinner />
        <p className="text-gray-500 font-medium">{texts.main.loadingParties}</p>
      </div>
    );
  }

  if (parties.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-bold text-lg">{texts.main.noParties}</p>
        <p className="text-gray-400 mt-2">{texts.main.firstPartyMsg}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {/* 10km 이내 근처 모임 */}
      {nearby.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
            {nearby.map((party) => (
              <PartyCard key={party.id} party={party} />
            ))}
          </div>
        </div>
      )}

      {/* 구분선 및 멀리 있는 모임 */}
      {far.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <h2 className="text-[16px] font-bold text-gray-400 shrink-0">
              {texts.main.farParties}
            </h2>
            <div className="h-[1px] flex-1 bg-gray-100" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 opacity-70 hover:opacity-100 transition-opacity">
            {far.map((party) => (
              <PartyCard key={party.id} party={party} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
