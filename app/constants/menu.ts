import { Language } from "../common/types";

// 페이지별로 타입을 정해설정, 자동완성 지원
interface Translation {
  common: {
    login: string;
    signup: string;
    start: string;
  };

  auth: {
    titleLogin: string;
    titleRegister: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    birthPlaceholder: string;
    phonePlaceholder: string;
    btnContinue: string;
    btnLogin: string;
    btnRegister: string;
    btnKakao: string;
    errorPassword: string;
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
}

// 한국어와 일본어 모든 필드가 같이 들어있어야 함.(한쪽에만 있고 한쪽에는 없고 불가)
export const menu: Record<Language, Translation> = {
  [Language.korean]: {
    common: {
      login: "로그인하기",
      signup: "회원가입",
      start: "시작하기",
    },
    
    auth: {
      titleLogin: "가입 또는 로그인을 위해\n이메일을 입력해주세요.",
      titleRegister: "회원가입을 진행하려면\n아래 항목을 입력해주세요.",
      emailPlaceholder: "이메일을 입력해주세요.",
      passwordPlaceholder: "비밀번호 (영문+숫자 6자 이상)",
      birthPlaceholder: "생년월일 (예: 980101)",
      phonePlaceholder: "전화번호",
      btnContinue: "계속",
      btnLogin: "로그인",
      btnRegister: "회원가입 하기",
      btnKakao: "카카오 간편 로그인",
      errorPassword: "❌ 영문과 숫자를 포함하여 6자 이상 입력해주세요.",
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
  },
  [Language.japanese]: {
    common: {
      login: "ログイン",
      signup: "会員登録",
      start: "始める",
    },
    
    auth: {
      titleLogin: "登録またはログインのために\nメールアドレスを入力してください。",
      titleRegister: "会員登録を進めるには\n以下の項目を入力してください。",
      emailPlaceholder: "メールアドレスを入力してください。",
      passwordPlaceholder: "パスワード (英数6文字以上)",
      birthPlaceholder: "生年月日 (例: 980101)",
      phonePlaceholder: "電話番号",
      btnContinue: "次へ",
      btnLogin: "ログイン",
      btnRegister: "会員登録する",
      btnKakao: "カカオで簡単ログイン",
      errorPassword: "❌ 英字と数字を含めて6文字以上で入力してください。",
    },
    home: {
      gachimura: "ガチムラ",
      heroTitle: "買い物は一緒に、\n精算はスマートに。",
      heroSubtitle: "コストコやトレーダースの大容量商品が負担なとき、\n近所の隣人と分け合って費用を自動計算しましょう。",
      feature1Title: "近くの隣人と集まり",
      feature1Desc: "地図ベースで町内の買い物集まりを一目で確認しましょう。",
      feature2Title: "正確な割り勘",
      feature2Desc: "レシートの写真をアップするだけで品目別に価格を分け、入金状況を追跡します。",
      toAction: "今すぐ始める",
      scrollMessage: "スクロールしてもっと見る",
    },
  },
};