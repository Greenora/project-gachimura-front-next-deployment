"use client";

import { useState } from "react";
import KakaoLogin from "@/components/auth/KakaoLogin";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { useLanguage } from "@/app/hooks/LanguageContext";
import Cookies from "js-cookie"; 

type Step = "EMAIL_INPUT" | "PASSWORD_INPUT" | "REGISTER_FORM";

export default function LoginPage() {
  const { texts } = useLanguage();
  const [step, setStep] = useState<Step>("EMAIL_INPUT");
  const [emailValue, setEmailValue] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({ mode: "onChange" });

  //  환경변수에서 API 주소 가져오기 (없으면 로컬호스트)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // 이메일 체크 (계속 버튼)
  const onContinue = async () => {
    const isValid = await trigger("email");
    if (!isValid) return;

    try {
      // API_URL 사용
      const res = await fetch(`${API_URL}/auth/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          setStep("PASSWORD_INPUT"); // 로그인 모드
        } else {
          setStep("REGISTER_FORM"); // 회원가입 모드
        }
      } else {
        alert("서버 연결에 실패했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  // 로그인 제출
  const onLoginSubmit = async (data: any) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailValue,
          password: data.passwordLogin,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        alert(`환영합니다! ${result.user.nickname}님!`);
        
        // localStorage 대신 쿠키에 저장 (1일 유지)
        Cookies.set("accessToken", result.accessToken, { expires: 1 });
        
        window.location.href = "/"; // 홈으로 이동
      } else {
        const err = await res.json();
        alert("로그인 실패: " + (err.message || "오류 발생"));
      }
    } catch (e) {
      console.error(e);
      alert("로그인 요청 실패");
    }
  };

  // 회원가입 제출
  const onRegisterSubmit = async (data: any) => {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.passwordRegister,
          nickname: "신규유저", // 닉네임 입력 UI가 없다면 임시값
          phone: data.phone,
          birthdate: data.birthdate,
        }),
      });

      if (res.ok) {
        alert("회원가입 성공! 이제 로그인해주세요.");
        setStep("PASSWORD_INPUT");
      } else {
        const err = await res.json();
        alert("가입 실패: " + (err.message || "오류 발생"));
      }
    } catch (e) {
      console.error(e);
      alert("회원가입 요청 실패");
    }
  };

  const onSubmit = (data: any) => {
    if (step === "REGISTER_FORM") onRegisterSubmit(data);
    else onLoginSubmit(data);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 relative">
      <div className="mb-10 flex flex-col items-center gap-2">
        <Image
          src="/images/gachimura_logo.png"
          alt="Gachimura"
          width={140}
          height={50}
          priority
        />
      </div>

      <div className="w-full max-w-sm transition-all duration-500 ease-in-out">
        <h1 className="text-xl font-bold text-center mb-10 text-gray-900 whitespace-pre-line leading-relaxed">
          {step === "REGISTER_FORM"
            ? texts.auth.titleRegister
            : texts.auth.titleLogin}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* 이메일 입력 */}
          <div>
            <input
              {...register("email", {
                required: true,
                pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              })}
              placeholder={texts.auth.emailPlaceholder}
              onChange={(e) => {
                setValue("email", e.target.value);
                setEmailValue(e.target.value);
              }}
              readOnly={step !== "EMAIL_INPUT"}
              className={`w-full px-4 py-4 rounded-lg border outline-none transition-colors text-black placeholder-gray-400
                ${
                  step !== "EMAIL_INPUT"
                    ? "bg-gray-50 border-gray-200 text-gray-500"
                    : "bg-white border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600"
                }
              `}
            />
          </div>

          {/* 비밀번호 입력 (로그인) */}
          <div
            className={`transition-all duration-500 overflow-hidden ${
              step === "PASSWORD_INPUT"
                ? "max-h-40 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <input
              {...register("passwordLogin", {
                required: step === "PASSWORD_INPUT",
              })}
              type="password"
              placeholder={texts.auth.passwordPlaceholder}
              className="w-full px-4 py-4 rounded-lg border border-gray-300 focus:border-green-600 outline-none text-black placeholder-gray-400"
            />
          </div>

          {/* 회원가입 폼 */}
          <div
            className={`transition-all duration-500 overflow-hidden flex flex-col gap-5 ${
              step === "REGISTER_FORM"
                ? "max-h-[600px] opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <input
              {...register("birthdate")}
              placeholder={texts.auth.birthPlaceholder}
              className="w-full px-4 py-4 rounded-lg border border-gray-300 focus:border-green-600 outline-none text-black placeholder-gray-400"
            />
            <input
              {...register("phone")}
              placeholder={texts.auth.phonePlaceholder}
              className="w-full px-4 py-4 rounded-lg border border-gray-300 focus:border-green-600 outline-none text-black placeholder-gray-400"
            />
            <div className="flex flex-col gap-1">
              <input
                {...register("passwordRegister", {
                  required: step === "REGISTER_FORM",
                  pattern: {
                    value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/,
                    message: "error",
                  },
                })}
                type="password"
                placeholder={texts.auth.passwordPlaceholder}
                className={`w-full px-4 py-4 rounded-lg border outline-none text-black placeholder-gray-400
                  ${
                    errors.passwordRegister
                      ? "border-red-500"
                      : "border-gray-300 focus:border-green-600"
                  }
                `}
              />
              {errors.passwordRegister && (
                <p className="text-xs text-red-500 ml-1">
                  {texts.auth.errorPassword}
                </p>
              )}
            </div>
          </div>

          {/* 버튼 */}
          <div className="mt-2">
            {step === "EMAIL_INPUT" ? (
              <button
                type="button"
                onClick={onContinue}
                className="w-full bg-[#166534] hover:bg-[#14532d] text-white font-medium py-4 rounded-lg transition"
              >
                {texts.auth.btnContinue}
              </button>
            ) : (
              <button
                type="submit"
                className="w-full bg-[#166534] hover:bg-[#14532d] text-white font-medium py-4 rounded-lg transition"
              >
                {step === "REGISTER_FORM"
                  ? texts.auth.btnRegister
                  : texts.auth.btnLogin}
              </button>
            )}
          </div>
        </form>

        {step === "EMAIL_INPUT" && (
          <div className="mt-4">
            <KakaoLogin buttonText={texts.auth.btnKakao} />
          </div>
        )}
      </div>
    </div>
  );
}