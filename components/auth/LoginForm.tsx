"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Cookies from "js-cookie";
import KakaoLogin from "@/components/auth/KakaoLogin";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { clientFetch } from "@/app/hooks/useClientFetch";

type Step = "EMAIL_INPUT" | "PASSWORD_INPUT" | "REGISTER_FORM";

export default function LoginForm() {
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

  const onContinue = async () => {
    const isValid = await trigger("email");
    if (!isValid) return;

    try {
      const data = await clientFetch<{ exists: boolean }>("/auth/check", {
        method: "POST",
        body: { email: emailValue },
      });

      setStep(data.exists ? "PASSWORD_INPUT" : "REGISTER_FORM");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "서버와 통신 중 오류가 발생했습니다.");
    }
  };

  const onLoginSubmit = async (data: any) => {
    try {
      const result = await clientFetch<{ user: { nickname: string }; accessToken: string }>(
        "/auth/login",
        {
          method: "POST",
          body: { email: emailValue, password: data.passwordLogin },
        }
      );

      Cookies.set("accessToken", result.accessToken, {
        expires: 1,
        path: "/",
      });

      alert(`${texts.auth.welcomePrefix} ${result.user.nickname}${texts.auth.welcomeSuffix}`);
      window.location.href = "/";
    } catch (error: any) {
      console.error(error);
      alert(error.message || texts.auth.alertLoginFail);
    }
  };

  const onRegisterSubmit = async (data: any) => {
    try {
      await clientFetch("/auth/signup", {
        method: "POST",
        body: {
          email: data.email,
          password: data.passwordRegister,
          nickname: "신규유저",
          phone: data.phone,
          birthdate: data.birthdate,
        },
      });

      alert(texts.auth.alertRegisterSuccess);
      setStep("PASSWORD_INPUT");
    } catch (error: any) {
      console.error(error);
      alert(error.message || texts.auth.alertRegisterFail);
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

          <div
            className={`transition-all duration-500 overflow-hidden ${
              step === "PASSWORD_INPUT" ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
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

          <div
            className={`transition-all duration-500 overflow-hidden flex flex-col gap-5 ${
              step === "REGISTER_FORM" ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
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
                {step === "REGISTER_FORM" ? texts.auth.btnRegister : texts.auth.btnLogin}
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
