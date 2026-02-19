'use client';

import { useState, useEffect, useRef } from 'react';
import PartyInput from "./PartyInput";

interface StoreInfo {
  name_ko: string;
  name_jp: string;
  address_ko: string;
  address_jp: string;
  latitude: number;
  longitude: number;
  place_id: string;
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
  // 사용자 현재 위치 저장
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 35.881321,
    lng: 128.629186
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  //  place_id로 특정 언어 주소 가져오기
  const getPlaceDetails = (placeId: string, language: string): Promise<{ address: string, name: string }> => {
    return new Promise((resolve, reject) => {
      if (!placesServiceRef.current) {
        reject('PlacesService not initialized');
        return;
      }

      const request = {
        placeId: placeId,
        fields: ['formatted_address', 'name'],
        language: language,
      };

      placesServiceRef.current.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.formatted_address) {
          resolve({
            address: place.formatted_address || '',
            name: place.name || ''
          });
        } else {
          reject(`Failed to get address for language: ${language}`);
        }
      });
    });
  };

  // 언어 코드 변환 함수
  const getGoogleMapsLangCode = (lang: string): string => {
    const langMap: Record<string, string> = {
      'ko': 'ko',
      'korean' : 'ko',
      'ja': 'ja',
      'japanese': 'ja',
      'jp': 'ja'
    };
    return langMap[lang.toLowerCase()] || 'ko';
  }

  // 지도 API 결과(장소)를 선택했을 때 이 함수를 호출하여 상태 업데이트
  const handleSelectPlace = async (
    name: string,
    placeId: string,
    lat: number,
    lng: number,
  ) => {
    try {
      const googleLangCode = getGoogleMapsLangCode(currentLang);
      const details = await getPlaceDetails(placeId, googleLangCode);

      const isJapanese = googleLangCode === 'ja';
      setStoreInfo({
        name_ko: isJapanese ? '' : details.name,
        name_jp: isJapanese ? details.name : '',
        address_ko: isJapanese ? '' : details.address,
        address_jp: isJapanese ? details.address : '',
        latitude: lat,
        longitude: lng,
        place_id: placeId,
      });

      // 검색창에 선택한 마트 이름 표시
      setSearchStore(details.name);

      if (googleMapRef.current && markerRef.current) {
        const newPos = { lat, lng };
        googleMapRef.current.setCenter(newPos);
        markerRef.current.setPosition(newPos);
      }
    } catch (error) {
      console.error('주소 가져오기 실패:', error);
    }
  };

  // 지도 초기화
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

        const googleLangCode = getGoogleMapsLangCode(currentLang);
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY}&libraries=places&language=${googleLangCode}`;
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
        // 초기 위치: storeInfo가 있으면 사용, 없으면 사용자 위치 사용 (지도 초기화), 코스트코 대구혁신도시점
        const initialPos = {
          lat: storeInfo.latitude || userLocation.lat,
          lng: storeInfo.longitude || userLocation.lng
        };

        googleMapRef.current = new google.maps.Map(mapRef.current, {
          center: initialPos,
          zoom: 15,
        });

        markerRef.current = new google.maps.Marker({
          position: initialPos,
          map: googleMapRef.current,
          title: '코스트코 대구혁신도시점'
        });

        //  PlacesService 초기화
        placesServiceRef.current = new google.maps.places.PlacesService(googleMapRef.current);

        // 자동완성(Autocomplete) 설정
        if (inputRef.current) {
          autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            fields: ['place_id', 'geometry', 'name'],
            types: ['establishment'], // 마트, 식당 등 업체 위주 검색
            componentRestrictions: { country: ['kr', 'jp'] } // 한국, 일본 내 검색
          });

          autocompleteRef.current.addListener('place_changed', async () => {
            const place = autocompleteRef.current?.getPlace();

            if (!place || !place.geometry || !place.geometry.location || !place.place_id) return;

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const name = place.name || '';
            const placeId = place.place_id;

            await handleSelectPlace(name, placeId, lat, lng);
          });
        }
      } catch (error) {
        console.error('failed to load Google Maps:', error);
      }
    }

    initMap();
  }, [currentLang]);

  // 언어 변경 시 주소와 이름 모두 업데이트
  useEffect(() => {
    // place_id가 없으면 선택된 장소가 없는 것이므로 return
    if (!storeInfo.place_id) return;

    // 언어 코드 변환 적용
    const googleLangCode = getGoogleMapsLangCode(currentLang);
    const isJapanese = googleLangCode === 'ja';

    // 현재 언어의 주소가 이미 있으면 재요청 불필요
    const currentAddress = isJapanese ? storeInfo.address_jp : storeInfo.address_ko;
    if (currentAddress) return;
    const currentName = isJapanese ? storeInfo.name_jp : storeInfo.name_ko;

    if (currentAddress && currentName) {
      if (searchStore !== currentName) {
        setTimeout(() => setSearchStore(currentName), 0);
      }
      return;
    }

    const fetchAddressForCurrentLang = async () => {
      try {
        const details = await getPlaceDetails(storeInfo.place_id, googleLangCode);

        setStoreInfo({
          ...storeInfo,
          name_ko: isJapanese ? storeInfo.name_ko : details.name,
          name_jp: isJapanese ? details.name : storeInfo.name_jp,
          address_ko: isJapanese ? storeInfo.address_ko : details.address,
          address_jp: isJapanese ? details.address : storeInfo.address_jp,
        });

        setSearchStore(details.name);
      } catch (error) {
        console.error(`${googleLangCode} 주소 가져오기 실패:`, error);
      }
    };

    fetchAddressForCurrentLang();
  }, [currentLang, storeInfo.place_id]);

  const currentDisplayName = getGoogleMapsLangCode(currentLang) === 'ja' ? storeInfo.name_jp : storeInfo.name_ko;

  return (
    <div className="mb-6">
      {/* 1. 검색창 */}
      <div className="relative">
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
      </div>

      {/* 2. Hidden Inputs: 실제 백엔드로 보낼 마트 이름과 주소를 담는 곳 */}
      {/* value가 storeInfo 상태와 연결되어 있어, 지도 검색 시 자동으로 업데이트됨 */}
      <input type="hidden" name="name_ko" value={storeInfo?.name_ko ?? ''} />
      <input type="hidden" name="name_jp" value={storeInfo?.name_jp ?? ''} />
      <input type="hidden" name="address_ko" value={storeInfo?.address_ko ?? ''} />
      <input type="hidden" name="address_jp" value={storeInfo?.address_jp ?? ''} />
      <input type="hidden" name="latitude" value={storeInfo?.latitude ?? ''} />
      <input type="hidden" name="longitude" value={storeInfo?.longitude ?? ''} />
      <input type="hidden" name="place_id" value={storeInfo?.place_id ?? ''} />

      <div className="flex">
        <div className="w-48" /> 
        <div className="flex-1">
          <div
            ref={mapRef}
            className="w-full h-56 bg-gray-100 border border-gray-200 mb-2"
          />

          <div className="flex items-center gap-2 min-h-7">
            {currentDisplayName ? (
              <>
                <span className="font-bold text-lg text-gray-900">
                  {currentDisplayName}
                </span>
                <span className="text-gray-500 text-sm">
                  {getGoogleMapsLangCode(currentLang) === 'ja' ? storeInfo.address_jp : storeInfo.address_ko}
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