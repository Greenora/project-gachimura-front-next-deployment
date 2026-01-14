import { Language } from "../common/types";

// 페이지별로 타입을 정해설정, 자동완성 지원
interface Translation {
  common: {
    login: string;
    signup: string;
    start: string;
  };
  home: {
    gachimura: string
    heroTitle: string;
    heroSubtitle: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    toAction: string;
    scrollMessage: string;
  };
  chat: {
    members: string;
    kick: string;
    pending: string;
    accept: string;
    reject: string;
    loading: string;
    noInfo: string;
    date: string;
    settle: string;
    end: string;
    placeholder: string;
    me: string;
    newMessage: string;
    kickConfirm: string;
    approveSuccess: string;
    rejectConfirm: string;
    rejectSuccess: string;
  };
  createParty: {
    pageTitle: string;
  };
  partyForm: {
    title: string;
    titlePlaceholder: string;
    date: string;
    dateSelect: string;
    timeSelect: string;
    errorDateTime: string;
    image: string;
    description: string;
    descriptionPlaceholder: string;
    store: string;
    storePlaceholder: string;
    storeEmpty: string;
    submit: string;
  };
}

// 한국어와 일본어 모든 필드가 같이 들어있어야 함.(한쪽에만 있고 한쪽에는 없고 불가)
export const menu: Record<Language, Translation> = {
  [Language.korean]: {
    common: {
      login: "로그인하기",
      signup: "회원가입",
      start: "시작하기",
    },
    home: {
      gachimura: "가치무라",
      heroTitle: "함께 장보고,\n정산은 똑똑하게.",
      heroSubtitle: "코스트코, 트레이더스 대용량 상품이 부담스러울 때\n근처 이웃과 함께 나누고 비용을 자동으로 계산해보세요.",
      feature1Title: "가까운 이웃과 모임",
      feature1Desc: "지도 기반으로 우리 동네에서 열리는 장보기 모임을 한눈에 확인하세요.",
      feature2Title: "정확한 1/N 정산",
      feature2Desc: "영수증 사진만 올리면 품목별로 가격을 나누고 입금 현황을 추적합니다.",
      toAction: "지금 바로 시작해보세요",
      scrollMessage: "스크롤해서 더 알아보기",
    },
    chat: {
      members: "참여 멤버",
      kick: "강퇴",
      pending: "승인 대기 중",
      accept: "수락",
      reject: "거절",
      loading: "로딩 중...",
      noInfo: "모임 정보 없음",
      date: "모임 날짜",
      settle: "정산하기",
      end: "모임 종료",
      placeholder: "메시지를 입력하세요...",
      me: "나",
      newMessage: "새 메시지 ↓",
      kickConfirm: "님을 강퇴하시겠습니까?",
      approveSuccess: "님의 참가를 승인했습니다.",
      rejectConfirm: "님의 요청을 거절하시겠습니까?",
      rejectSuccess: "신청을 거절 처리했습니다.",
    },
    createParty: {
      pageTitle: "모임 등록",
    },
    partyForm: {
      title: "제목",
      titlePlaceholder: "제목을 입력해주세요",
      date: "모임 날짜, 시간",
      dateSelect: "날짜 선택",
      timeSelect: "시간 선택",
      errorDateTime: "날짜와 시간을 모두 선택해주세요",
      image: "모임 대표사진(선택)",
      description: "모임 설명",
      descriptionPlaceholder: "구매할 물품과 기타 설명을 자세하게 작성해주세요. 정확한 모임 위치는 모임의 채팅방에서 공유해주세요!",
      store: "마트",
      storePlaceholder: "마트 이름을 검색하세요",
      storeEmpty: "마트를 검색하여 선택해주세요",
      submit: "모임 등록하기",
    },
  },
  [Language.japanese]: {
    common: {
      login: "ログイン",
      signup: "会員登録",
      start: "始める",
    },
    home: {
      gachimura: "ガチムラ",
      heroTitle: "買い物は一緒に、\n精算はスマートに。",
      heroSubtitle: "コストコやトレーダースの大容量商品가 負担なとき、\n近所の隣人と分け合って費用を自動計算しましょう。",
      feature1Title: "近くの隣人と集まり",
      feature1Desc: "地図ベースで町内の買い物集まりを一目で確認しましょう。",
      feature2Title: "正確な割り勘",
      feature2Desc: "レシートの写真をアップするだけで品目別に価格を分け、入金状況を追跡します。",
      toAction: "今すぐ始める",
      scrollMessage: "スクロールしてもっと見る",
    },
    chat: {
      members: "参加メンバー",
      kick: "追放",
      pending: "承認待ち",
      accept: "承認",
      reject: "拒否",
      loading: "読み込み中...",
      noInfo: "集まりの情報なし",
      date: "集まりの日付",
      settle: "精算する",
      end: "集まりを終了",
      placeholder: "メッセージを入力してください...",
      me: "自分",
      newMessage: "新しいメッセージ ↓",
      kickConfirm: "さんを追放しますか？",
      approveSuccess: "さんの参加を承認しました。",
      rejectConfirm: "さんの要請を拒否しますか？",
      rejectSuccess: "申請を拒否処理しました。",
    },
    createParty: {
      pageTitle: "集まりの登録",
    },
    partyForm: {
      title: "タイトル",
      titlePlaceholder: "タイトルを入力してください",
      date: "集まりの日付・時間",
      dateSelect: "日付を選択",
      timeSelect: "時間を選択",
      errorDateTime: "日付と時間を選択してください",
      image: "代表写真(任意)",
      description: "集まりの説明",
      descriptionPlaceholder: "購入する物品やその他の説明を詳しく記入してください。正確な場所はチャットルームで共有してください！",
      store: "マート",
      storePlaceholder: "マート名を検索してください",
      storeEmpty: "マートを検索して選択してください。",
      submit: "集まりを登録する",
    },
  },
};
