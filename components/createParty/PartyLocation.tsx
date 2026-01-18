'use client';

import { useState, useEffect, useRef } from 'react';
import PartyInput from "./PartyInput";

interface StoreInfo {
  name: string;
  address_ko: string;
  address_jp: string;
  latitude: number;
  longitude: number;
}
interface Props {
  label: string;
  placeholder: string;
  emptyMessage: string;
  storeInfo: StoreInfo;
  setStoreInfo: (val: StoreInfo) => void;
  errors?: {
    storeName?: string;
    storeAddress?: string;
  };
  currentLang: string;
}

export default function PartyLocation({ label, placeholder, emptyMessage, storeInfo, setStoreInfo, errors, currentLang }: Props) {
  // UI 전용 검색어 상태
  const [searchStore, setSearchStore] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);


  // 지도 API 결과(장소)를 선택했을 때 이 함수를 호출하여 상태 업데이트
  const handleSelectPlace = (
    name: string,
    address_ko: string,
    address_jp: string,
    lat: number,
    lng: number,
  ) => {
    setStoreInfo({
      name,
      address_ko,
      address_jp,
      latitude: lat,
      longitude: lng,
    });

    if (googleMapRef.current && markerRef.current) {
      const newPos = { lat, lng };
      googleMapRef.current.setCenter(newPos);
      markerRef.current.setPosition(newPos);
    }
  };

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.google?.maps) {
          resolve();
          return;
        }

        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          const checkGoogle = setInterval(() => {
            if (window.google?.maps) {
              clearInterval(checkGoogle);
              resolve();
            }
          }, 100);
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY}&libraries=places&language=ko`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('failed to Google Maps script load'));
        document.head.appendChild(script);
      });
    };

    async function initMap() {
      try {
        await loadGoogleMapsScript();

        if (!mapRef.current || !window.google) return;
        // 지도 초기화
        const initialPos = {
          lat: storeInfo.latitude || 35.8714,
          lng: storeInfo.longitude || 128.6014
        };

        googleMapRef.current = new google.maps.Map(mapRef.current, {
          center: initialPos,
          zoom: 15,
        });

        markerRef.current = new google.maps.Marker({
          position: initialPos,
          map: googleMapRef.current,
        });

        //  PlacesService 초기화
        placesServiceRef.current = new google.maps.places.PlacesService(googleMapRef.current);

        // 자동완성(Autocomplete) 설정
        if (inputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            fields: ['place_id', 'geometry', 'name'],
            types: ['establishment'], // 마트, 식당 등 업체 위주 검색
            componentRestrictions: { country: 'kr' } // 한국 내 검색 제한
          });

          autocomplete.addListener('place_changed', async () => {
            const place = autocomplete.getPlace();

            if (!place.geometry || !place.geometry.location || !place.place_id) return;

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const name = place.name || '';
            const placeId = place.place_id;

            try {
              const addressKo = await getPlaceDetails(placeId, 'ko');
              const addressJp = await getPlaceDetails(placeId, 'ja');

              handleSelectPlace(name, addressKo, addressJp, lat, lng);
            } catch (error) {
              console.error('주소 가져오기 실패:', error);
            }
          });
        }
      } catch (error) {
        console.error('failed to load Google Maps:', error);
      }
    }

    // place_id로 특정 언어 주소 가져오기
    const getPlaceDetails = (placeId: string, language: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!placesServiceRef.current) {
          reject('PlacesService not initialized');
          return;
        }
          
        const request = {
          placeId: placeId,
          fields: ['formatted_address'],
          language: language,
        };

        placesServiceRef.current.getDetails(request, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.formatted_address) {
            resolve(place.formatted_address);
          } else {
            reject(`Failed to get address for language: ${language}`);
          }
        });
      });
    };

    initMap();
  }, []);

  return (
    <div className="mb-6">
      {/* 1. 검색창 */}
      <PartyInput
        ref={inputRef}
        label={label}
        placeholder={placeholder}
        value={searchStore}
        onChange={(e) =>
          setSearchStore(e.target.value)}
        error={errors?.storeName}
        className="mb-2"
      />

      {/* 2. Hidden Inputs: 실제 백엔드로 보낼 마트 이름과 주소를 담는 곳 */}
      {/* value가 storeInfo 상태와 연결되어 있어, 지도 검색 시 자동으로 업데이트됨 */}
      <input type="hidden" name="store_name" value={storeInfo?.name} />
      <input type="hidden" name="address_ko" value={storeInfo?.address_ko} />
      <input type="hidden" name="address_jp" value={storeInfo?.address_jp} />
      <input type="hidden" name="latitude" value={storeInfo?.latitude} />
      <input type="hidden" name="longitude" value={storeInfo?.longitude} />

      <div className="flex">
        <div className="w-48" /> 
        <div className="flex-1">
          <div
            ref={mapRef}
            className="w-full h-56 bg-gray-100 border border-gray-200 mb-2"
          />

          <div className="flex items-center gap-2 min-h-7">
            {storeInfo?.name ? (
              <>
                <span className="font-bold text-lg text-gray-900">
                  {storeInfo.name}
                </span>
                <span className="text-gray-500 text-sm">
                  {currentLang === 'ja' ? storeInfo.address_jp : storeInfo.address_ko}
                </span>
              </>
            ) : (
              <span className="text-gray-400 text-sm">{emptyMessage}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}