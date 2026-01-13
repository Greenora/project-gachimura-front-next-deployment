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
    errorLoginAuth: string;
    errorBirth: string;
    errorPhone: string;
    errorEmail: string;
    welcomePrefix: string;
    welcomeSuffix: string;
    alertLoginFail: string;
    alertRegisterSuccess: string;
    alertRegisterFail: string;
    alertServerError: string;
    loading: string;
    rememberMe: string;
    forgotPassword: string;
    forgotPasswordMessage: string;
  };
  home: {
    gachimura: string;
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
      errorPassword: "영문과 숫자를 포함하여 6자 이상 입력해주세요.",
      errorEmail: "올바른 이메일 형식이 아닙니다.",
      errorLoginAuth: "이메일 혹은 비밀번호를 확인해주세요.",
      errorBirth: "생년월일 6자리를 입력해주세요.",
      errorPhone: "올바른 전화번호 형식이 아닙니다. (예: 01012345678)",
      welcomePrefix: "환영합니다!",
      welcomeSuffix: "님, 로그인되었습니다.",
      alertLoginFail: "로그인 요청에 실패했습니다.",
      alertRegisterSuccess: "회원가입 성공! 이제 로그인해주세요.",
      alertRegisterFail: "가입 실패: 다시 시도해주세요.",
      alertServerError: "서버와 통신 중 오류가 발생했습니다.",
      loading: "로딩 중...",
      rememberMe: "로그인 유지",
      forgotPassword: "비밀번호 찾기",
      forgotPasswordMessage: "비밀번호 찾기 기능은 준비 중입니다.",
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
      errorPassword: "英字と数字を含めて6文字以上で入力してください。",
      errorLoginAuth: "メールアドレス、またはパスワードが違います。",
      errorEmail: "正しいメールアドレスの形式ではありません。",
      errorBirth: "生年月日6桁を入力してください。",
      errorPhone: "正しい電話番号の形式ではありません。(例: 09012345678)",
      welcomePrefix: "ようこそ！",
      welcomeSuffix: "さん、ログインしました。",
      alertLoginFail: "ログインリクエストに失敗しました。",
      alertRegisterSuccess: "会員登録成功！ログインできます。",
      alertRegisterFail: "登録失敗：再度お試しください。",
      alertServerError: "サーバーとの通信中にエラーが発生しました",
      loading: "通信中...",
      rememberMe: "ログイン状態を維持",
      forgotPassword: "パスワードを忘れた方",
      forgotPasswordMessage: "パスワード再設定機能は準備中です。",
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
  },
};