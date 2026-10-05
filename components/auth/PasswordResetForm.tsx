"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { useLanguage } from "@/app/hooks/LanguageContext";

function PasswordResetForm() {
  const { lang } = useLanguage();
  const jp = lang === "japanese";
  const [token, setToken] = useState<string | null>(() => window.location.hash.slice(1) || null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Keep the email proof in memory only, not in history or local storage.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    const readToken = () => {
      const value = window.location.hash.slice(1);
      if (!value) return;
      setToken(value);
      setDone(false);
      setMessage("");
      setError("");
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    };
    window.addEventListener("hashchange", readToken);
    return () => window.removeEventListener("hashchange", readToken);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || done) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    setError("");
    if (token && password !== data.get("confirmPassword")) {
      setError(jp ? "パスワードが一致しません。" : "비밀번호가 서로 다릅니다.");
      return;
    }
    setBusy(true);
    try {
      await clientFetch(`/auth/password-reset/${token ? "confirm" : "request"}`, {
        method: "POST", redirectOnUnauthorized: false,
        body: token ? { token, password } : { email: String(data.get("email") || "").trim() },
      });
      setDone(true);
      setMessage(token
        ? (jp ? "変更しました。もう一度ログインしてください。" : "변경했습니다. 다시 로그인해주세요.")
        : (jp ? "登録済みのメールなら案内を送信します。15分以内に確認してください。" : "가입된 이메일이라면 안내를 보냅니다. 15분 안에 메일을 확인해주세요."));
    } catch (err) {
      setError(err instanceof Error ? err.message : (jp ? "もう一度お試しください。" : "잠시 후 다시 시도해주세요."));
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = "mt-2 w-full rounded-lg border border-gray-400 p-3 text-black";
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-24">
      <section className="w-full max-w-md space-y-5 rounded-xl bg-white p-6 shadow text-gray-900">
        <h1 className="text-2xl font-bold">{jp ? "パスワード再設定" : "비밀번호 재설정"}</h1>
        {!done && <form onSubmit={submit} className="space-y-4">
          {token ? <>
            <label className="block">{jp ? "新しいパスワード" : "새 비밀번호"}
              <input className={inputStyle} name="password" type="password" autoComplete="new-password" required
                minLength={6} maxLength={72} pattern="(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{6,72}"
                aria-describedby="password-rule" />
            </label>
            <p id="password-rule" className="text-sm">{jp ? "英字と数字を両方含む6〜72文字" : "영문과 숫자를 섞어서 6~72자"}</p>
            <label className="block">{jp ? "パスワード確認" : "비밀번호 확인"}
              <input className={inputStyle} name="confirmPassword" type="password" autoComplete="new-password" required maxLength={72} />
            </label>
          </> : <label className="block">{jp ? "メールアドレス" : "이메일"}
            <input className={inputStyle} name="email" type="email" autoComplete="email" maxLength={255} required />
          </label>}
          <button className="w-full rounded-lg bg-green-700 p-3 text-white disabled:opacity-50" disabled={busy}>
            {busy ? (jp ? "処理中…" : "처리 중…") : token ? (jp ? "変更する" : "비밀번호 변경") : (jp ? "案内メール送信" : "안내 메일 받기")}
          </button>
        </form>}
        {error && <p role="alert" className="text-red-600">{error}</p>}
        {message && <p role="status">{message}</p>}
        <Link className="inline-block underline" href="/login">{jp ? "ログインに戻る" : "로그인으로 돌아가기"}</Link>
      </section>
    </main>
  );
}

// The reset token lives in the browser URL fragment, which the server cannot read.
export default dynamic(() => Promise.resolve(PasswordResetForm), { ssr: false });
