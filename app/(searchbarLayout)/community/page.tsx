"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Avatar from "@/components/common/Avatar";
import CommunityComposerDrawer from "@/components/main/CommunityComposerDrawer";
import WritePostButton from "@/components/main/WritePostButton";
import toast from "react-hot-toast";
import { clientFetch } from "@/app/hooks/useClientFetch";

interface CommunityAuthor {
  id?: number;
  nickname?: string;
  nickname_jp?: string;
  profileImage?: string | null;
}

interface CommunityComment {
  id: number;
  postId: number;
  content: string;
  locale: "ko" | "ja";
  createdAt: string | Date;
  author: CommunityAuthor;
}

interface CommunityPost {
  id: number;
  author: CommunityAuthor;
  linkedParty?: {
    id: number;
    title: string;
    storeName?: string | null;
    status?: string;
  } | null;
  content: string;
  locale: "ko" | "ja";
  createdAt: string | Date;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

interface CurrentUser {
  id: number;
}

interface LinkableParty {
  id: number;
  title: string;
  storeName?: string | null;
}

interface CommunityFeedResponse {
  items: CommunityPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

export default function CommunityPage() {
  const { lang, texts } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [commentsByPost, setCommentsByPost] = useState<Record<number, CommunityComment[]>>({});
  const [openCommentPanels, setOpenCommentPanels] = useState<Record<number, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});
  const [likingPosts, setLikingPosts] = useState<Record<number, boolean>>({});
  const [submittingComments, setSubmittingComments] = useState<Record<number, boolean>>({});
  const [linkableParties, setLinkableParties] = useState<LinkableParty[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // URL에서 필터 파라미터 읽기
  const filter = searchParams.get("filter") || "latest";
  const communityLocale = lang === Language.japanese ? "ja" : "ko";

  const title = lang === Language.japanese ? "コミュニティ" : "커뮤니티";
  const subtitle =
    lang === Language.japanese
      ? "今日の買い物メモを、気軽にひと言でシェアしてみましょう。"
      : "오늘 장보기에서 건진 꿀정보, 한 줄로 가볍게 공유해봐요.";
  const successMessage = lang === Language.japanese ? "投稿を作成しました。" : "게시글을 작성했어요.";

  const renderSystemToken = useMemo(() => {
    return {
      TIP_SPLIT_BULK:
        lang === Language.japanese
          ? "大容量商品は人数で分けるとコスパが良いです。"
          : "대용량 상품은 인원수로 나누면 가성비가 좋아요.",
      STORE_PEAK_TIME:
        lang === Language.japanese
          ? "夕方のピークタイムを避けるとレジ待ちが短いです。"
          : "저녁 피크타임을 피하면 계산 대기가 짧아요.",
    } as Record<string, string>;
  }, [lang]);

  const getLocalizedContent = (raw: string) => {
    if (!raw?.startsWith("__COMM__|")) {
      return raw;
    }

    const [, token] = raw.split("|");
    return renderSystemToken[token] || raw;
  };

  const getDisplayNickname = (author: CommunityAuthor) => {
    if (lang === Language.japanese && author?.nickname_jp) {
      return author.nickname_jp;
    }
    return author?.nickname || author?.nickname_jp || texts.chat.unknownNickname;
  };

  const formatRelativeTime = (dateLike: string | Date) => {
    const date = new Date(dateLike);
    if (Number.isNaN(date.getTime())) return "";

    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return lang === Language.japanese ? "たった今" : "방금 전";
    if (diffMin < 60) return lang === Language.japanese ? `${diffMin}分前` : `${diffMin}분 전`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return lang === Language.japanese ? `${diffHour}時間前` : `${diffHour}시간 전`;
    const diffDay = Math.floor(diffHour / 24);
    return lang === Language.japanese ? `${diffDay}日前` : `${diffDay}일 전`;
  };

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      // 필터 변경 시 기존 데이터 초기화
      setPosts([]);
      setNextCursor(null);
      setHasMore(false);
      try {
        const data = await clientFetch<CommunityFeedResponse>(
          `/community/posts?limit=20&sort=${filter}&locale=${communityLocale}`,
        );
        setPosts(data?.items || []);
        setNextCursor(data?.nextCursor || null);
        setHasMore(Boolean(data?.hasMore));
      } catch (error) {
        console.error(error);
        toast.error(lang === Language.japanese ? "投稿一覧の読み込みに失敗しました。" : "게시글을 불러오지 못했어요.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [lang, filter, communityLocale]);

  useEffect(() => {
    const fetchLinkableParties = async () => {
      try {
        const profile = await clientFetch<CurrentUser>("/users/profile");
        const parties = await clientFetch<LinkableParty[]>(`/parties/user/${profile.id}`);
        setLinkableParties(parties || []);
      } catch (error) {
        console.error(error);
        setLinkableParties([]);
      }
    };

    fetchLinkableParties();
  }, []);

  useEffect(() => {
    if (!hasMore || !nextCursor || isLoading || isLoadingMore) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }

        setIsLoadingMore(true);
        try {
          const data = await clientFetch<CommunityFeedResponse>(
            `/community/posts?limit=20&sort=${filter}&locale=${communityLocale}&cursor=${encodeURIComponent(nextCursor)}`,
          );
          setPosts((prev) => [...prev, ...(data?.items || [])]);
          setNextCursor(data?.nextCursor || null);
          setHasMore(Boolean(data?.hasMore));
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoadingMore(false);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, nextCursor, filter, communityLocale]);

  useEffect(() => {
    if (searchParams.get("compose") === "1") {
      setIsComposerOpen(true);
    }
  }, [searchParams]);

  const closeComposer = () => {
    setIsComposerOpen(false);

    if (searchParams.get("compose") === "1") {
      router.replace(pathname);
    }
  };

  const createPost = async ({
    content,
    linkedPartyId,
  }: {
    content: string;
    linkedPartyId: number | null;
  }) => {
    try {
      const created = await clientFetch<CommunityPost>("/community/posts", {
        method: "POST",
        body: { content, locale: communityLocale, linkedPartyId },
      });
      setPosts((prev) => [created, ...prev]);
      toast.success(successMessage);
      closeComposer();
    } catch (error) {
      console.error(error);
      toast.error(lang === Language.japanese ? "投稿に失敗しました。" : "게시글 작성에 실패했어요.");
    }
  };

  const toggleLike = async (post: CommunityPost) => {
    if (likingPosts[post.id]) {
      return;
    }

    setLikingPosts((prev) => ({ ...prev, [post.id]: true }));
    try {
      if (post.likedByMe) {
        await clientFetch(`/community/posts/${post.id}/likes`, { method: "DELETE" });
      } else {
        await clientFetch(`/community/posts/${post.id}/likes`, { method: "POST" });
      }

      setPosts((prev) =>
        prev.map((item) => {
          if (item.id !== post.id) return item;
          const nextLiked = !item.likedByMe;
          return {
            ...item,
            likedByMe: nextLiked,
            likeCount: nextLiked ? item.likeCount + 1 : Math.max(0, item.likeCount - 1),
          };
        }),
      );
    } catch (error) {
      console.error(error);
      toast.error(lang === Language.japanese ? "いいねに失敗しました。" : "좋아요 처리에 실패했어요.");
    } finally {
      setLikingPosts((prev) => ({ ...prev, [post.id]: false }));
    }
  };

  const toggleComments = async (postId: number) => {
    const isOpen = Boolean(openCommentPanels[postId]);
    setOpenCommentPanels((prev) => ({ ...prev, [postId]: !isOpen }));

    if (isOpen || commentsByPost[postId]) {
      return;
    }

    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const comments = await clientFetch<CommunityComment[]>(`/community/posts/${postId}/comments`);
      setCommentsByPost((prev) => ({ ...prev, [postId]: comments || [] }));
    } catch (error) {
      console.error(error);
      toast.error(lang === Language.japanese ? "コメント読み込みに失敗しました。" : "댓글을 불러오지 못했어요.");
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const submitComment = async (postId: number) => {
    const content = (commentInputs[postId] || "").trim();
    if (!content || submittingComments[postId]) {
      return;
    }

    setSubmittingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const created = await clientFetch<CommunityComment>(`/community/posts/${postId}/comments`, {
        method: "POST",
        body: { content, locale: communityLocale },
      });

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), created],
      }));
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post,
        ),
      );
      setOpenCommentPanels((prev) => ({ ...prev, [postId]: true }));
    } catch (error) {
      console.error(error);
      toast.error(lang === Language.japanese ? "コメント作成に失敗しました。" : "댓글 작성에 실패했어요.");
    } finally {
      setSubmittingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <header className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-black tracking-tight text-gray-900">{title}</h1>
            <p className="mt-2 text-[15px] text-gray-600">{subtitle}</p>
          </div>
          <WritePostButton variant="compact" />
        </div>
      </header>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-[14px] font-bold text-gray-400">
            {texts.auth.loading}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-[14px] font-bold text-gray-400">
            {lang === Language.japanese ? "まだ投稿がありません。最初の投稿を作成してみましょう。" : "아직 게시글이 없어요. 첫 글을 작성해보세요."}
          </div>
        ) : (
          posts.map((post) => {
            const nickname = getDisplayNickname(post.author);
            const comments = commentsByPost[post.id] || [];
            const isCommentOpen = Boolean(openCommentPanels[post.id]);
            return (
              <article key={post.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <Avatar nickname={nickname} size={40} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-black text-gray-900">@{nickname}</p>
                      <span className="text-[12px] font-bold text-gray-400">{formatRelativeTime(post.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-[15px] font-medium leading-7 text-gray-800">{getLocalizedContent(post.content)}</p>

                    {post.linkedParty && (
                      <Link
                        href={`/party/${post.linkedParty.id}`}
                        className="mt-3 flex items-center justify-between rounded-2xl border border-green-100 bg-green-50 px-4 py-3 transition-colors hover:border-green-200 hover:bg-green-100/70"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-tight text-green-700">
                            {lang === Language.japanese ? "リンクされた集まり" : "연결된 모임"}
                          </p>
                          <p className="mt-1 truncate text-[14px] font-black text-gray-900">
                            {post.linkedParty.title}
                          </p>
                          {post.linkedParty.storeName && (
                            <p className="mt-0.5 truncate text-[12px] font-bold text-gray-500">
                              {post.linkedParty.storeName}
                            </p>
                          )}
                        </div>
                        <span className="ml-3 shrink-0 text-[12px] font-black text-green-700">
                          {lang === Language.japanese ? "見る" : "보기"}
                        </span>
                      </Link>
                    )}

                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void toggleLike(post)}
                        disabled={Boolean(likingPosts[post.id])}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-bold transition-colors ${
                          post.likedByMe
                            ? "border-rose-200 bg-rose-50 text-rose-600"
                            : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={post.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                        </svg>
                        {post.likeCount}
                      </button>

                      <button
                        type="button"
                        onClick={() => void toggleComments(post.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-[12px] font-bold text-gray-500 transition-colors hover:bg-gray-50"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {post.commentCount}
                      </button>
                    </div>

                    {isCommentOpen && (
                      <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                        {loadingComments[post.id] ? (
                          <p className="text-[12px] font-bold text-gray-400">{texts.auth.loading}</p>
                        ) : (
                          <div className="space-y-2">
                            {comments.length === 0 ? (
                              <p className="text-[12px] font-bold text-gray-400">
                                {lang === Language.japanese ? "まだコメントがありません。" : "아직 댓글이 없어요."}
                              </p>
                            ) : (
                              comments.map((comment) => {
                                const commentNickname = getDisplayNickname(comment.author);
                                return (
                                  <div key={comment.id} className="rounded-lg bg-white px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[12px] font-black text-gray-700">@{commentNickname}</span>
                                      <span className="text-[11px] font-bold text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
                                    </div>
                                    <p className="mt-1 text-[13px] font-medium text-gray-700">{comment.content}</p>
                                  </div>
                                );
                              })
                            )}

                            <div className="flex items-center gap-2 pt-1">
                              <input
                                value={commentInputs[post.id] || ""}
                                onChange={(event) =>
                                  setCommentInputs((prev) => ({ ...prev, [post.id]: event.target.value }))
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    void submitComment(post.id);
                                  }
                                }}
                                placeholder={lang === Language.japanese ? "コメントを書く" : "댓글을 입력하세요"}
                                className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-gray-700 outline-none focus:border-green-600"
                              />
                              <button
                                type="button"
                                onClick={() => void submitComment(post.id)}
                                disabled={Boolean(submittingComments[post.id])}
                                className="rounded-full bg-[#166534] px-3 py-2 text-[12px] font-black text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                              >
                                {lang === Language.japanese ? "送信" : "등록"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {!isLoading && hasMore && (
        <div
          ref={sentinelRef}
          className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-center text-[12px] font-bold text-gray-400"
        >
          {isLoadingMore
            ? texts.auth.loading
            : lang === Language.japanese
              ? "スクロールしてもっと見る"
              : "스크롤해서 더 보기"}
        </div>
      )}

      <CommunityComposerDrawer
        isOpen={isComposerOpen}
        lang={lang}
        linkableParties={linkableParties}
        onClose={closeComposer}
        onSubmit={createPost}
      />
    </section>
  );
}
