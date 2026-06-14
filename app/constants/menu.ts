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
    btnLine: string;
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
    settlementWaiting: string;
    joinSettlement: string;
    placeholder: string;
    me: string;
    newMessage: string;
    kickConfirm: string;
    approveSuccess: string;
    rejectConfirm: string;
    rejectSuccess: string;
    systemJoinTemplate: string;
    systemLeaveTemplate: string;
    systemSettlementStart: string;
    systemSettlementEditing: string;
    systemSettlementResumed: string;
    systemSettlementConfirmedTitle: string;
    systemSettlementTotalLabel: string;
    systemSettlementPerMemberTemplate: string;
    reviewUnavailable: string;
    reviewAlreadyDone: string;
    reviewDone: string;
    settlementGoTitle: string;
    settlementWaitTitle: string;
    moving: string;
    closedPartyPlaceholder: string;
    unknownNickname: string;
    confirmStartSettlement: string;
    confirmCloseParty: string;
    statusUpdateError: string;
    genericError: string;
    genericFail: string;
    reportComingSoon: string;
    invalidPartyId: string;
    noAccessTitle: string;
    noAccessDescription: string;
    backToHome: string;
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
    settling: string;
    closed: string;
    anonymous: string;
    nowRecruiting: string;
    nearbyParties: string;
    farParties: string;
    myChats: string;
    locationPermissionDenied: string;
    locationPermissionGuide: string;
    locationTimeout: string;
    locationError: string;
    locationSuccess: string;
    locationCoordsSuccess: string;
    noJoinedChats: string;
    chatRoomAriaSuffix: string;
    thumbnailAltSuffix: string;
    hostAriaLabel: string;
    hostLabel: string;
    locationPermissionRequired: string;
    personalSettingsAria: string;
    quickActionsAria: string;
    communitySidebarTitle: string;
    communityLatest: string;
    communityPopular: string;
    communityMostComments: string;
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
    submitSuccess: string;
  };
  partyDetail: {
    meetingDate: string;
    location: string;
    noLocation: string;
    joinButton: string;
    alreadyJoined: string;
    isHostMessage: string;
    participantCount: string;
    loadingError: string;
    joinSuccess: string;
    joinFail: string;
    goToChat: string;
    goToChatButton: string;
    movingToChat: string;
    closedParty: string;
  };
  header: {
    logout: string;
    logoutSuccess: string;
    myPage: string;
    editProfile: string;
  };
  userPage: {
    userParties: string;
    noParties: string;
    userPosts: string;
    noPosts: string;
    treeScore: string;
    levels: {
      soil: string;
      seed: string;
      sprout: string;
      sapling: string;
      tree: string;
      forest: string;
    };
    reviewsCount: string;
    userNotFound: string;
    userDeleteMsg: string;
  };
  review: {
    closedMessage: string;
    goReview: string;
    reportProblem: string;
  };
  reviewPage: {
    title: string;
    description: string;
    question1: string;
    question2: string;
    question3: string;
    submit: string;
    footer: string;
    success: string;
    veryUnsatisfied: string;
    unsatisfied: string;
    satisfied: string;
    verySatisfied: string;
    allFieldsRequired: string;
    submitError: string;
    notFound: string;
    alreadyReviewed: string;
  };
  settlement: {
    title: string;
    uploadReceipt: string;
    writeManually: string;
    receiptScanning: string;
    pleaseWait: string;
    purchaseItems: string;
    addItem: string;
    addItemHint: string;
    itemName: string;
    quantity: string;
    price: string;
    totalPrice: string;
    saveItems: string;
    startSettlement: string;
    selectItems: string;
    selectHint: string;
    myEstimate: string;
    submitSelection: string;
    membersSelecting: string;
    confirmSettlement: string;
    confirmMessage: string;
    paymentStatus: string;
    paid: string;
    unpaid: string;
    confirmPayment: string;
    perPerson: string;
    kakaoSettle: string;
    kakaoNotReady: string;
    sentMessage: string;
    waitingHost: string;
    waitingItems: string;
    notStarted: string;
    settlementWaiting: string;
    joinSettlement: string;
    reportMember: string;
    editSettlement: string;
    chatRoom: string;
    quantitySuffix: string;
    memberSuffix: string;
    receiptRecognized: string;
    receiptUploaded: string;
    settlementCreated: string;
    settlementCreateFail: string;
    minItemRequired: string;
    itemsSaved: string;
    itemsSaveFail: string;
    settlementStarted: string;
    settlementStartFail: string;
    revertedToDraft: string;
    revertFail: string;
    selectionSaved: string;
    selectionSaveFail: string;
    confirmPrompt: string;
    settlementConfirmed: string;
    confirmFail: string;
    paymentConfirmed: string;
    paymentConfirmFail: string;
    uploadFail: string;
    kakaoShareFail: string;
    kakaoShareTitle: string;
    kakaoShareButton: string;
    invalidPartyId: string;
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
      alertLoginFail: "이메일 혹은 비밀번호를 확인해주세요.",
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
      settlementWaiting: "정산 대기중",
      joinSettlement: "정산 참여하기",
      placeholder: "메시지를 입력하세요...",
      me: "나",
      newMessage: "새 메시지 ↓",
      kickConfirm: "님을 강퇴하시겠습니까?",
      approveSuccess: "님의 참가를 승인했습니다.",
      rejectConfirm: "님의 요청을 거절하시겠습니까?",
      rejectSuccess: "신청을 거절 처리했습니다.",
      systemJoinTemplate: "{nickname}님이 모임에 합류했습니다!",
      systemLeaveTemplate: "{nickname}님이 모임을 떠났습니다.",
      systemSettlementStart: "📋 정산이 시작됐어요! 정산 페이지에서 구매한 품목을 선택해주세요.",
      systemSettlementEditing: "✏️ 호스트가 품목을 수정하고 있어요. 잠시만 기다려주세요.",
      systemSettlementResumed: "✅ 품목 수정이 완료됐어요! 정산 페이지에서 구매한 품목을 선택해주세요.",
      systemSettlementConfirmedTitle: "💰 정산이 확정되었습니다!",
      systemSettlementTotalLabel: "총 금액",
      systemSettlementPerMemberTemplate: "{nickname}: {amount}",
      reviewUnavailable: "모임이 종료된 후 평가할 수 있습니다.",
      reviewAlreadyDone: "이미 이 모임에 대한 평가를 완료했습니다.",
      reviewDone: "평가 완료",
      settlementGoTitle: "정산 페이지로 이동합니다",
      settlementWaitTitle: "호스트가 정산을 시작하면 활성화됩니다",
      moving: "이동 중...",
      closedPartyPlaceholder: "종료된 모임입니다.",
      unknownNickname: "알 수 없음",
      confirmStartSettlement: "정산을 시작할까요?",
      confirmCloseParty: "모임이 종료되었나요?",
      statusUpdateError: "상태 변경 처리 중 오류가 발생했습니다.",
      genericError: "오류 발생",
      genericFail: "실패",
      reportComingSoon: "신고 페이지는 현재 준비 중입니다.",
      invalidPartyId: "유효하지 않은 모임 번호입니다.",
      noAccessTitle: "접근 권한 없음",
      noAccessDescription: "이 채팅방의 회원이 아닙니다. 모임에 가입 신청을 먼저 해주세요.",
      backToHome: "홈으로 돌아가기",
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
      settling: "정산중",
      closed: "마감",
      anonymous: "익명",
      nowRecruiting: "지금 바로 참여 가능한 모임",
      nearbyParties: "근처의 모임 (10km 이내)",
      farParties: "조금 멀리 있는 모임",
      myChats: "참여 중인 채팅",
      locationPermissionDenied: "위치 권한이 거부되었습니다.",
      locationPermissionGuide: "주소창 왼쪽의 '자물쇠' 아이콘을 클릭하여 위치 권한을 '허용'으로 변경해주세요.",
      locationTimeout: "위치 측정 시간이 초과되었습니다.",
      locationError: "위치 정보를 가져오는 데 실패했습니다.",
      locationSuccess: "현재 위치({region} {district})로 업데이트되었습니다.",
      locationCoordsSuccess: "위치 좌표가 업데이트되었습니다.",
      noJoinedChats: "참여 중인 채팅이 없습니다.",
      chatRoomAriaSuffix: "채팅방",
      thumbnailAltSuffix: "썸네일",
      hostAriaLabel: "개설자",
      hostLabel: "Host",
      locationPermissionRequired: "권한 확인 필요",
      personalSettingsAria: "개인 설정",
      quickActionsAria: "빠른 실행 메뉴",
      communitySidebarTitle: "필터",
      communityLatest: "최신순",
      communityPopular: "인기순",
      communityMostComments: "댓글 많은 순",
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
      submitSuccess: "모임이 등록되었습니다!",
    },
    partyDetail: {
      meetingDate: "모임 날짜",
      location: "모임 위치",
      noLocation: "위치 정보 없음",
      joinButton: "모임 가입 신청하기",
      alreadyJoined: "이미 참여한 모임입니다",
      isHostMessage: "내가 만든 모임입니다",
      participantCount: "현재 {count}명이 참여하고 있어요!",
      loadingError: "정보를 불러오지 못했습니다.",
      joinSuccess: "신청 완료!",
      joinFail: "참여 실패",
      goToChat: "채팅방으로 이동합니다.",
      goToChatButton: "채팅방으로 이동하기",
      movingToChat: "채팅방으로 이동 중...",
      closedParty: "이미 마감된 모임입니다",
    },
    header: {
      logout: "로그아웃",
      logoutSuccess: "로그아웃되었습니다.",
      myPage: "내 페이지 가기",
      editProfile: "내 정보 수정하기",
    },
    userPage: {
      userParties: "{nickname}님의 소분 모임",
      noParties: "아직 생성한 모임이 없습니다.",
      userPosts: "{nickname}님의 글",
      noPosts: "작성한 게시글이 없습니다.",
      treeScore: "가치 실현도",
      levels: {
        soil: "소일유저",
        seed: "씨앗유저",
        sprout: "새싹유저",
        sapling: "묘목유저",
        tree: "나무유저",
        forest: "숲유저",
      },
      reviewsCount: "받은 평가 {count}개",
      userNotFound: "사용자를 찾을 수 없습니다.",
      userDeleteMsg: "존재하지 않거나 삭제된 유저입니다.",
    },
    review: {
      closedMessage: "해당 모임은 종료되었습니다. 함께한 멤버들에 대해 평가를 남겨주세요!",
      goReview: "평가하기",
      reportProblem: "모임 진행 중 문제가 있었나요? 신고하기",
    },
    reviewPage: {
      title: "모임 리뷰",
      description: "에 대한 리뷰를 작성해주세요.",
      question1: "모임은 원활하게 진행되었다고 생각하시나요?",
      question2: "참여자 모두가 시간약속을 잘 지켰다고 생각하시나요?",
      question3: "비용 정산은 잘 이루어졌다고 생각하시나요?",
      submit: "제출하기",
      footer: "해당 리뷰는 참여자의 프로필 점수에 반영됩니다.",
      success: "평가가 완료되었습니다!",
      veryUnsatisfied: "매우 불만족",
      unsatisfied: "불만족",
      satisfied: "만족",
      verySatisfied: "매우 만족",
      allFieldsRequired: "모든 항목에 대해 평가를 선택해주세요.",
      submitError: "평가 제출 중 오류가 발생했습니다.",
      notFound: "모임을 찾을 수 없습니다.",
      alreadyReviewed: "이미 이 모임에 대한 평가를 완료했습니다.",
    },
    settlement: {
      title: "정산하기",
      uploadReceipt: "영수증 업로드하기",
      writeManually: "직접 작성하기",
      receiptScanning: "영수증 스캔중...",
      pleaseWait: "잠시만 기다려주세요",
      purchaseItems: "구매품목",
      addItem: "+ 품목 추가",
      addItemHint: "품목을 추가해주세요.",
      itemName: "품목명",
      quantity: "수량",
      price: "가격",
      totalPrice: "총 가격",
      saveItems: "품목 저장",
      startSettlement: "정산 시작하기",
      selectItems: "품목 선택",
      selectHint: "본인이 가져갈 품목을 선택하세요",
      myEstimate: "나의 예상 금액",
      submitSelection: "선택 완료",
      membersSelecting: "멤버들이 선택 중...",
      confirmSettlement: "정산 확정하기",
      confirmMessage: "정산을 확정하시겠습니까? 확정 후에는 변경할 수 없습니다.",
      paymentStatus: "입금 현황",
      paid: "완료",
      unpaid: "미입금",
      confirmPayment: "입금 확인",
      perPerson: "1인 당",
      kakaoSettle: "카카오톡 정산하기",
      kakaoNotReady: "카카오톡 정산 기능은 준비 중입니다.",
      sentMessage: "정산 메세지를 전송했어요!",
      waitingHost: "호스트가 품목을 등록하고 있습니다...",
      waitingItems: "아직 품목이 없습니다.",
      notStarted: "아직 정산이 시작되지 않았습니다.",
      settlementWaiting: "정산 대기중",
      joinSettlement: "정산 참여하기",
      reportMember: "미정산 멤버 신고하기",
      editSettlement: "수정하기",
      chatRoom: "채팅방으로",
      quantitySuffix: "개",
      memberSuffix: "명",
      receiptRecognized: "영수증 인식 완료! {count}개 품목이 자동 입력되었습니다.",
      receiptUploaded: "영수증이 업로드되었습니다. 품목을 직접 입력해주세요.",
      settlementCreated: "정산이 생성되었습니다.",
      settlementCreateFail: "정산 생성 실패",
      minItemRequired: "최소 1개 이상의 품목을 입력해주세요.",
      itemsSaved: "품목이 저장되었습니다.",
      itemsSaveFail: "품목 저장 실패",
      settlementStarted: "정산이 시작되었습니다! 멤버들에게 알림이 전송되었습니다.",
      settlementStartFail: "정산 시작 실패",
      revertedToDraft: "품목을 수정해주세요!",
      revertFail: "수정 전환 실패",
      selectionSaved: "품목 선택이 완료되었습니다!",
      selectionSaveFail: "선택 저장 실패",
      confirmPrompt: "정산을 확정하시겠습니까? 확정 후에는 변경할 수 없습니다.",
      settlementConfirmed: "정산이 확정되었습니다!",
      confirmFail: "확정 실패",
      paymentConfirmed: "입금이 확인되었습니다.",
      paymentConfirmFail: "입금 확인 실패",
      uploadFail: "업로드 실패",
      kakaoShareFail: "카카오톡 공유에 실패했습니다.",
      kakaoShareTitle: "가치무라 정산",
      kakaoShareButton: "정산 확인하기",
      invalidPartyId: "유효하지 않은 모임 번호입니다.",
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
      btnKakao: "カカオでログイン",
      btnLine: "LINEでログイン",
      errorPassword: "英字と数字を含めて6文字以上で入力してください。",
      errorLoginAuth: "メールアドレス、またはパスワードが違います。",
      errorEmail: "正しいメールアドレスの形式ではありません。",
      errorBirth: "生年月日6桁を入力してください。",
      errorPhone: "正しい電話番号の形式ではありません。(例: 09012345678)",
      welcomePrefix: "ようこそ！",
      welcomeSuffix: "さん、ログインしました。",
      alertLoginFail: "メールアドレス、またはパスワードが違います。",
      alertRegisterSuccess: "会員登録成功！ログインできます。",
      alertRegisterFail: "登録失敗：再度お試しください。",
      alertServerError: "サーバーとの通信中にエラーが発生しました",
      loading: "通信中...",
      rememberMe: "ログイン状態を維持",
      forgotPassword: "パスワードを忘れた方",
      forgotPasswordMessage: "パスワード再設定機能は準備中です。",
    },
    home: {
      gachimura: "カチムラ",
      heroTitle: "買い物は一緒に、\n精算はスマートに。",
      heroSubtitle: "コストコやトレーダースの大容量商品が負担なとき、\n近所の隣人と分け合って費用を自動計算しましょう。",
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
      settlementWaiting: "精算待機中",
      joinSettlement: "精算に参加する",
      placeholder: "メッセージを入力してください...",
      me: "自分",
      newMessage: "新しいメッセージ ↓",
      kickConfirm: "さんを追放しますか？",
      approveSuccess: "さんの参加を承認しました。",
      rejectConfirm: "さんの要請を拒否しますか？",
      rejectSuccess: "申請を拒否処理しました。",
      systemJoinTemplate: "{nickname}さんが集まりに参加しました！",
      systemLeaveTemplate: "{nickname}さんが集まりを退出しました。",
      systemSettlementStart: "📋 精算が始まりました。精算ページで購入した品目を選択してください。",
      systemSettlementEditing: "✏️ ホストが品目を見直しています。少しお待ちください。",
      systemSettlementResumed: "✅ 品目の修正が完了しました。精算ページで購入した品目を選択してください。",
      systemSettlementConfirmedTitle: "💰 精算が確定しました。",
      systemSettlementTotalLabel: "合計金額",
      systemSettlementPerMemberTemplate: "{nickname}: {amount}",
      reviewUnavailable: "この会の終了後に評価できます。",
      reviewAlreadyDone: "この会の評価はすでに完了しています。",
      reviewDone: "評価済み",
      settlementGoTitle: "精算ページに移動します",
      settlementWaitTitle: "ホストが精算を開始すると利用できます",
      moving: "移動中...",
      closedPartyPlaceholder: "終了した会です。",
      unknownNickname: "不明",
      confirmStartSettlement: "精算を開始しますか？",
      confirmCloseParty: "この会を終了しますか？",
      statusUpdateError: "ステータスの変更中にエラーが発生しました。",
      genericError: "エラーが発生しました",
      genericFail: "処理に失敗しました",
      reportComingSoon: "通報ページは現在準備中です。",
      invalidPartyId: "無効な会の番号です。",
      noAccessTitle: "アクセス権限がありません",
      noAccessDescription: "このチャットルームのメンバーではありません。先に会への参加申請をしてください。",
      backToHome: "ホームに戻る",
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
      firstPartyMsg: "最初の集まりの主人公になってみてください！",
      startParty: "集まりを始める",
      loadingParties: "集まりを読み込んでいます...",
      shoppingDate: "買い物日",
      recruiting: "募集中",
      settling: "精算中",
      closed: "終了",
      anonymous: "匿名",
      nowRecruiting: "今すぐ参加可能な集まり",
      nearbyParties: "近くの集まり (10km以内)",
      farParties: "少し遠い集まり",
      myChats: "参加中のチャット",
      locationPermissionDenied: "位置情報の利用権限が拒否されました。",
      locationPermissionGuide: "アドレスバー左側の「鍵」アイコンをクリックし、位置情報の権限を「許可」に変更してください。",
      locationTimeout: "位置情報の取得がタイムアウトしました。",
      locationError: "位置情報の取得に失敗しました。",
      locationSuccess: "現在地({region} {district})に更新されました。",
      locationCoordsSuccess: "位置座標が更新されました。",
      noJoinedChats: "参加中のチャットはありません。",
      chatRoomAriaSuffix: "のチャットルーム",
      thumbnailAltSuffix: "のサムネイル",
      hostAriaLabel: "主催者",
      hostLabel: "主催者",
      locationPermissionRequired: "権限をご確認ください",
      personalSettingsAria: "個人設定",
      quickActionsAria: "クイックアクションメニュー",
      communitySidebarTitle: "フィルター",
      communityLatest: "最新順",
      communityPopular: "人気順",
      communityMostComments: "コメントが多い順",
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
      submitSuccess: "集まりが登録されました！",
    },
    partyDetail: {
      meetingDate: "集まりの日付",
      location: "集まりの場所",
      noLocation: "位置情報なし",
      joinButton: "集まりに参加する",
      alreadyJoined: "すでに参加している集まりです",
      isHostMessage: "自分が作った集まりです",
      participantCount: "現在{count}人が参加しています！",
      loadingError: "情報を読み込めませんでした。",
      joinSuccess: "申込完了！",
      joinFail: "参加に失敗しました",
      goToChat: "チャットルームに移動します。",
      goToChatButton: "チャットルームへ移動",
      movingToChat: "チャットルームへ移動中...",
      closedParty: "すでに締め切られた集まりです",
    },
    header: {
      logout: "ログアウト",
      logoutSuccess: "ログアウトしました。",
      myPage: "マイページ",
      editProfile: "プロフィール編集",
    },
    userPage: {
      userParties: "{nickname}さんの共同購入",
      noParties: "まだ作成した集まりがありません。",
      userPosts: "{nickname}さんの投稿",
      noPosts: "投稿した記事がありません。",
      treeScore: "価値実現度",
      levels: {
        soil: "ソイルユーザー",
        seed: "シードユーザー",
        sprout: "若葉ユーザー",
        sapling: "苗木ユーザー",
        tree: "樹木ユーザー",
        forest: "フォレストユーザー",
      },
      reviewsCount: "受け取ったレビュー {count}個",
      userNotFound: "ユーザーが見つかりません。",
      userDeleteMsg: "存在しないか、削除されたユーザーです。",
    },
    review: {
      closedMessage: "この会は終了しました。いっしょに参加したメンバーを評価してください。",
      goReview: "評価する",
      reportProblem: "会の進行中に問題がありましたか？通報する",
    },
    reviewPage: {
      title: "集まりのレビュー",
      description: "に対するレビューを作成してください。",
      question1: "集まりはスムーズに進行したと思いますか？",
      question2: "参加者全員が時間を守ったと思いますか？",
      question3: "費用の精算は適切に行われたと思いますか？",
      submit: "提出する",
      footer: "このレビューは参加者のプロフィールスコアに反映されます。",
      success: "評価が完了しました！",
      veryUnsatisfied: "非常に不満足",
      unsatisfied: "不満足",
      satisfied: "満足",
      verySatisfied: "非常に満足",
      allFieldsRequired: "すべての項目の評価を選択してください。",
      submitError: "評価の提出中にエラーが発生しました。",
      notFound: "集まりが見つかりません。",
      alreadyReviewed: "この会の評価はすでに完了しています。",
    },
    settlement: {
      title: "精算する",
      uploadReceipt: "レシートをアップロード",
      writeManually: "直接入力する",
      receiptScanning: "レシートを読み取り中...",
      pleaseWait: "少々お待ちください",
      purchaseItems: "購入品目",
      addItem: "+ 品目追加",
      addItemHint: "品目を追加してください。",
      itemName: "品名",
      quantity: "数量",
      price: "価格",
      totalPrice: "合計金額",
      saveItems: "品目を保存",
      startSettlement: "精算を開始する",
      selectItems: "品目を選択",
      selectHint: "自分が持ち帰る品目を選択してください",
      myEstimate: "自分の予想金額",
      submitSelection: "選択完了",
      membersSelecting: "メンバーが選択中...",
      confirmSettlement: "精算を確定する",
      confirmMessage: "精算を確定しますか？確定後は変更できません。",
      paymentStatus: "入金状況",
      paid: "完了",
      unpaid: "未入金",
      confirmPayment: "入金確認",
      perPerson: "1人当たり",
      kakaoSettle: "カカオトークで精算",
      kakaoNotReady: "カカオトーク精算機能は準備中です。",
      sentMessage: "精算メッセージを送信しました！",
      waitingHost: "ホストが品目を登録しています...",
      waitingItems: "まだ品目がありません。",
      notStarted: "まだ精算が開始されていません。",
      settlementWaiting: "精算待機中",
      joinSettlement: "精算に参加する",
      reportMember: "未精算メンバーを報告する",
      editSettlement: "修正する",
      chatRoom: "チャットへ戻る",
      quantitySuffix: "個",
      memberSuffix: "人",
      receiptRecognized: "レシート認識完了！{count}件の品目が自動入力されました。",
      receiptUploaded: "レシートがアップロードされました。品目を直接入力してください。",
      settlementCreated: "精算が作成されました。",
      settlementCreateFail: "精算の作成に失敗しました。",
      minItemRequired: "少なくとも1つ以上の品目を入力してください。",
      itemsSaved: "品目を保存しました。",
      itemsSaveFail: "品目の保存に失敗しました。",
      settlementStarted: "精算を開始しました！メンバーに通知を送信しました。",
      settlementStartFail: "精算の開始に失敗しました。",
      revertedToDraft: "品目を修正してください！",
      revertFail: "修正モードへの切り替えに失敗しました。",
      selectionSaved: "品目の選択が完了しました！",
      selectionSaveFail: "選択の保存に失敗しました。",
      confirmPrompt: "精算を確定しますか？確定後は変更できません。",
      settlementConfirmed: "精算が確定しました！",
      confirmFail: "確定に失敗しました。",
      paymentConfirmed: "入金を確認しました。",
      paymentConfirmFail: "入金確認に失敗しました。",
      uploadFail: "アップロードに失敗しました。",
      kakaoShareFail: "カカオトーク共有に失敗しました。",
      kakaoShareTitle: "カチムラ精算",
      kakaoShareButton: "精算を確認する",
      invalidPartyId: "無効な会の番号です。",
    },
  },
};