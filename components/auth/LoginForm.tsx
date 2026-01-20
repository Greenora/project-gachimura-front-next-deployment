"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast"; 
import KakaoLogin from "@/components/auth/KakaoLogin";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { Language } from "@/app/common/types";
import { 
  Spinner, 
  EmailIcon, 
  LockIcon, 
  EyeIcon, 
  EyeOffIcon, 
  PhoneIcon, 
  CalendarIcon 
} from "@/components/common/Icons";
import LineLogin from "@/components/auth/LineLogin";

/**
 * 통합 로그인 폼 컴포넌트
 * 
 * 3단계로 동작함:
 * 1. EMAIL_INPUT: 이메일 입력 → 기존 회원인지 체크
 * 2. PASSWORD_INPUT: 기존 회원이면 로그인
 * 3. REGISTER_FORM: 신규 회원이면 회원가입
 * 
 * 소셜 로그인 (카카오, 라인)도 여기서 보여줌
 */

// 타입 정의
interface LoginResponse {
  user: { nickname: string };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface CheckResponse {
  exists: boolean; // 이메일이 이미 가입되어 있는지 여부
}

interface RegisterData {
  email: string;
  passwordRegister: string;
  phone?: string;
  birthdate?: string; // YYMMDD 형식 (6자리)
}

// 폼 진행 단계
type Step = "EMAIL_INPUT" | "PASSWORD_INPUT" | "REGISTER_FORM";

interface FormData {
  email: string;
  passwordLogin?: string;
  passwordRegister?: string;
  phone?: string;
  birthdate?: string;
}

// 쿠키에서 가져온 언어 값이 유효한지 체크하는 함수
const isValidLanguage = (value: string | undefined): value is Language => {
  return value !== undefined && Object.values(Language).includes(value as Language);
};

export default function LoginForm() {
  const router = useRouter();
  const { texts, lang } = useLanguage();
  const [step, setStep] = useState<Step>("EMAIL_INPUT");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordRegister, setShowPasswordRegister] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); 

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>({ mode: "onChange" });

  // 이메일 체크: 백엔드에 이 이메일이 가입되어 있는지 물어봄
  const handleEmailCheck = async (email: string) => {
    if (isLoading) return; // 중복 요청 방지
    setIsLoading(true);

    try {
      const data = await clientFetch<CheckResponse>("/auth/check", {
        method: "POST",
        body: { email },
      });
      // 있으면 로그인 화면, 없으면 회원가입 화면으로 전환
      setStep(data.exists ? "PASSWORD_INPUT" : "REGISTER_FORM");
      clearErrors();
    } catch (error) {
      console.error(error);
      toast.error(texts.auth.alertServerError || "서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인 폼 데이터 타입
  interface LoginFormData {
    email: string;
    passwordLogin: string;
  }

  // 로그인 처리
  const handleLogin = async (data: LoginFormData) => {
    if (isLoading) return; // 중복 요청 방지
    setIsLoading(true);

    try {
      const result = await clientFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: { 
          email: data.email, 
          password: data.passwordLogin,
          rememberMe: rememberMe, // 자동 로그인 체크 여부
        },
      });

      // 토큰 쿠키에 저장
      // 자동 로그인 체크했으면 30일, 안했으면 1일
      const expiresInDays = rememberMe ? 30 : 1;
      Cookies.set("accessToken", result.accessToken, { expires: expiresInDays, path: "/" });
      Cookies.set("refreshToken", result.refreshToken, { expires: 7, path: "/" });

      toast.success(`${texts.auth.welcomePrefix} ${result.user.nickname}${texts.auth.welcomeSuffix}`);
      router.push("/"); // 메인 페이지로 이동
    } catch {
      setError("passwordLogin", {
        type: "manual",
        message: texts.auth.errorLoginAuth,
      });
      toast.error(texts.auth.alertLoginFail);
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입 처리
  const handleRegister = async (data: RegisterData) => {
    if (isLoading) return; // 중복 요청 방지
    setIsLoading(true);

    // 언어 설정 감지 (백엔드에 보내서 닉네임 생성할 때 사용)
    const cookieLang = Cookies.get("language");
    const currentLang = lang || (isValidLanguage(cookieLang) ? cookieLang : Language.korean);
    const isJapanese = currentLang === Language.japanese;
    const langCode = isJapanese ? 'jp' : 'ko'; // 일본어면 'jp', 아니면 'ko'

    const requestBody = {
      email: data.email,
      password: data.passwordRegister,
      nickname: undefined, 
      phone: data.phone || undefined, 
      birthdate: data.birthdate || undefined,
      language: langCode,
    };

    try {
      await clientFetch("/auth/signup", {
        method: "POST",
        body: requestBody,
      });
      toast.success(texts.auth.alertRegisterSuccess);
      setStep("PASSWORD_INPUT");
    } catch (error: unknown) {
      console.error(error);
      const err = error as { message?: string | string[] };
      // 배열인 경우 첫 번째 메시지, 문자열인 경우 그대로 사용
      if (err.message) {
        const errorMessage = Array.isArray(err.message) ? err.message[0] : err.message;
        toast.error(errorMessage);
      } else {
        toast.error(texts.auth.alertServerError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data: FormData) => {
    if (step === "EMAIL_INPUT") {
      handleEmailCheck(data.email);
    } else if (step === "REGISTER_FORM") {
      handleRegister({
        email: data.email,
        passwordRegister: data.passwordRegister || "",
        phone: data.phone,
        birthdate: data.birthdate,
      });
    } else {
      handleLogin({
        email: data.email,
        passwordLogin: data.passwordLogin || "",
      });
    }
  };

  // 비밀번호 찾기 핸들러
  const handleForgotPassword = () => {
    toast(texts.auth.forgotPasswordMessage || "비밀번호 찾기 기능은 준비 중입니다.", { icon: "🔧" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 relative">
      <div className="mb-10 flex flex-col items-center gap-2">
        <Image src="/images/gachimura_logo.png" alt="Gachimura" width={140} height={50} priority />
      </div>

      <div className="w-full max-w-sm transition-all duration-500 ease-in-out">
        <h1 className="text-xl font-bold text-center mb-10 text-gray-900 whitespace-pre-line leading-relaxed font-sans">
          {step === "REGISTER_FORM" ? texts.auth.titleRegister : texts.auth.titleLogin}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          {/* 이메일 */}
          <div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <EmailIcon />
              </span>
              <input
                {...register("email", {
                  required: true,
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: texts.auth.errorEmail,
                  },
                })}
                placeholder={texts.auth.emailPlaceholder}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setValue("email", newValue);
                  clearErrors("email");
                  
                  // 수정 시 단계 리셋
                  if (step !== "EMAIL_INPUT") {
                    setStep("EMAIL_INPUT");
                    setValue("passwordLogin", "");
                    setValue("passwordRegister", "");
                  }
                }}
                disabled={isLoading} 
                className={`w-full pl-12 pr-4 py-4 rounded-lg border outline-none transition-colors text-black placeholder-gray-400 font-sans disabled:bg-gray-100
                  ${errors.email ? "border-red-500" : "border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600"}
                `}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 ml-1 mt-1 font-sans">{errors.email.message?.toString()}</p>
            )}
          </div>

          {/* 비밀번호 (로그인) */}
          <div className={`transition-all duration-500 overflow-hidden ${step === "PASSWORD_INPUT" ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <LockIcon />
                </span>
                <input
                  {...register("passwordLogin", { required: step === "PASSWORD_INPUT" })}
                  type={showPasswordLogin ? "text" : "password"}
                  disabled={isLoading}
                  placeholder={texts.auth.passwordPlaceholder}
                  className={`w-full pl-12 pr-12 py-4 rounded-lg border outline-none text-black placeholder-gray-400 font-sans
                    ${errors.passwordLogin ? "border-red-500" : "border-gray-300 focus:border-green-600"}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordLogin(!showPasswordLogin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswordLogin ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.passwordLogin && (
                <p className="text-xs text-red-500 ml-1 font-sans">{errors.passwordLogin.message?.toString()}</p>
              )}
              
              {/* 자동 로그인 + 비밀번호 찾기 */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span>{texts.auth.rememberMe || "로그인 유지"}</span>
                </label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-green-600 hover:text-green-700 hover:underline"
                >
                  {texts.auth.forgotPassword || "비밀번호 찾기"}
                </button>
              </div>
            </div>
          </div>

          {/* 회원가입 폼 */}
          <div className={`transition-all duration-500 overflow-hidden flex flex-col gap-5 ${step === "REGISTER_FORM" ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
            {/* 생년월일 */}
            <div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <CalendarIcon />
                </span>
                <input
                  {...register("birthdate", {
                    required: step === "REGISTER_FORM",
                    pattern: { value: /^\d{6}$/, message: texts.auth.errorBirth },
                  })}
                  disabled={isLoading}
                  placeholder={texts.auth.birthPlaceholder}
                  className={`w-full pl-12 pr-4 py-4 rounded-lg border outline-none text-black placeholder-gray-400 font-sans ${errors.birthdate ? "border-red-500" : "border-gray-300 focus:border-green-600"}`}
                />
              </div>
              {errors.birthdate && <p className="text-xs text-red-500 ml-1 mt-1 font-sans">{errors.birthdate.message?.toString()}</p>}
            </div>

            {/* 전화번호 */}
            <div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <PhoneIcon />
                </span>
                <input
                  {...register("phone", {
                    required: step === "REGISTER_FORM",
                    pattern: { value: /^0[0-9]{1,2}-?[0-9]{3,4}-?[0-9]{4}$/, message: texts.auth.errorPhone },
                  })}
                  disabled={isLoading}
                  placeholder={texts.auth.phonePlaceholder}
                  className={`w-full pl-12 pr-4 py-4 rounded-lg border outline-none text-black placeholder-gray-400 font-sans ${errors.phone ? "border-red-500" : "border-gray-300 focus:border-green-600"}`}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 ml-1 mt-1 font-sans">{errors.phone.message?.toString()}</p>}
            </div>

            {/* 비밀번호 (회원가입) */}
            <div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <LockIcon />
                </span>
                <input
                  {...register("passwordRegister", {
                    required: step === "REGISTER_FORM",
                    pattern: { value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, message: texts.auth.errorPassword },
                  })}
                  type={showPasswordRegister ? "text" : "password"}
                  disabled={isLoading}
                  placeholder={texts.auth.passwordPlaceholder}
                  className={`w-full pl-12 pr-12 py-4 rounded-lg border outline-none text-black placeholder-gray-400 font-sans ${errors.passwordRegister ? "border-red-500" : "border-gray-300 focus:border-green-600"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordRegister(!showPasswordRegister)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswordRegister ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.passwordRegister && <p className="text-xs text-red-500 ml-1 mt-1 font-sans">{errors.passwordRegister.message?.toString()}</p>}
            </div>
          </div>

          <div className="mt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full text-white font-medium py-4 rounded-lg transition font-sans flex items-center justify-center gap-2
                ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-[#166534] hover:bg-[#14532d]"}
              `}
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span>{texts.auth.loading}</span>
                </>
              ) : (
                step === "EMAIL_INPUT" ? texts.auth.btnContinue : (step === "REGISTER_FORM" ? texts.auth.btnRegister : texts.auth.btnLogin)
              )}
            </button>
          </div>
        </form>

        {step === "EMAIL_INPUT" && (
          <div className="mt-4 flex flex-col gap-3">
            <KakaoLogin buttonText={texts.auth.btnKakao} />
            <LineLogin buttonText={texts.auth.btnLine}/>
          </div>
        )}
      </div>
    </div>
  );
}