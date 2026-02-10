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
  main: {
    sidebarTitle: string;
    latest: string;
    imminent: string;
    showCompleted: string;
    searchPlaceholder: string;
    currentLocation: string;
    locating: string;
    noParties: string;
    firstPartyMsg: string;
    startParty: string;
    loadingParties: string;
    shoppingDate: string;
    recruiting: string;
    closed: string;
    anonymous: string;
    nowRecruiting: string;
  };
  footer: {
    team: string;
    teamIntro: string;
    teamGithub: string;
    service: string;
    serviceIntro: string;
    feedback: string;
    inquiry: string;
    survey: string;
    rights: string;
  };
  partyForm: {
    pageTitle: string;
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
      btnKakao: "카카오 로그인",
      btnLine: "LINE 로그인",
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
    main: {
      sidebarTitle: "필터",
      latest: "최신순",
      imminent: "임박순",
      showCompleted: "만료된 파티 보기",
      searchPlaceholder: "어떤 품목을 같이 살까요?",
      currentLocation: "현재 위치",
      locating: "위치 찾는 중...",
      noParties: "아직 생성된 모임이 없습니다.",
      firstPartyMsg: "첫 번째 모임의 주인공이 되어보세요!",
      startParty: "모임 시작하기",
      loadingParties: "모임을 불러오는 중입니다...",
      shoppingDate: "장보기 날짜",
      recruiting: "모집중",
      closed: "마감",
      anonymous: "익명",
      nowRecruiting: "지금 바로 참여 가능한 모임",
    },
    footer: {
      team: "팀",
      teamIntro: "팀 소개",
      teamGithub: "팀 GitHub",
      service: "서비스",
      serviceIntro: "서비스 소개",
      feedback: "의견",
      inquiry: "1:1 문의",
      survey: "설문조사",
      rights: "©2026 All Rights reserved Team Greenora",
    },
    partyForm: {
      pageTitle: "모임 등록",
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

    auth: {
      titleLogin: "등록 또는 로그인のために\nメールアドレスを入力してください。",
      titleRegister: "会員登録を進める에는\n以下の項目を入力してください。",
      emailPlaceholder: "メールアドレスを入力してください。",
      passwordPlaceholder: "パスワード (英数6文字以上)",
      birthPlaceholder: "生年月日 (例: 980101)",
      phonePlaceholder: "電話番号",
      btnContinue: "次へ",
      btnLogin: "ログイン",
      btnRegister: "会員登録する",
      btnKakao: "カカオでログイン",
      btnLine: "LINEでログイン",
      errorPassword: "英字と数字を含めて6文字以上で入力してください。",
      errorLoginAuth: "メールアドレス、またはパスワードが違います。",
      errorEmail: "正しいメールアドレスの形式ではありません。",
      errorBirth: "生年月日6桁を入力してください。",
      errorPhone: "正しい電話번호の形式ではありません。(例: 09012345678)",
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
      gachimura: "カ치무라",
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
    main: {
      sidebarTitle: "フィルター",
      latest: "最新順",
      imminent: "締め切り間近",
      showCompleted: "終了した集まりを表示",
      searchPlaceholder: "どんな商品を一緒に買いますか？",
      currentLocation: "現在地",
      locating: "位置を探しています...",
      noParties: "まだ作成された集まりがありません。",
      firstPartyMsg: "最初の集まり의 주인공になってみてください！",
      startParty: "集まりを始める",
      loadingParties: "集まりを読み込んでいます...",
      shoppingDate: "買い物日",
      recruiting: "募集中",
      closed: "終了",
      anonymous: "匿名",
      nowRecruiting: "今すぐ参加可能な集まり",
    },
    footer: {
      team: "チーム",
      teamIntro: "チーム紹介",
      teamGithub: "チームGitHub",
      service: "サービス",
      serviceIntro: "サービス紹介",
      feedback: "フィードバック",
      inquiry: "1:1お問い合わせ",
      survey: "アンケート",
      rights: "©2026 All Rights reserved Team Greenora",
    },
    partyForm: {
      pageTitle: "集まりの登録",
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