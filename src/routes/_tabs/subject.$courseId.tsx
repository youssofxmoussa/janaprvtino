import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  Bookmark,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import { courses } from "@/lib/courses";
import { PdfViewer } from "@/components/ios/PdfViewer";
import { Watermark } from "@/components/ios/Watermark";
import { useServerFn } from "@tanstack/react-start";
import { getCourseContent } from "@/lib/content.functions";
import { Button } from "@/components/ui/button";
import { spring } from "@/components/ios/press";
import { recordMinutes, recordSubject, useFocusTimer } from "@/lib/activity";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { VideoPlayer, VideoSkin, Video } from "@videojs/react/video";
import "@videojs/react/video/skin.css";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Route = createFileRoute("/_tabs/subject/$courseId")({
  head: ({ params }) => {
    const course = courses.find(
      (c) => c.id.toLowerCase() === params.courseId.toLowerCase(),
    );

    const title = `${course?.title || "Subject"} · Jana Prvt Course`;
    const description = `Study ${
      course?.title || "this subject"
    } with videos, PDFs, and Q&A.`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },

  component: SubjectPage,
});

/* =========================================================
   REAL VIDEO + PDF SOURCES
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

type Tab = "Videos" | "PDFs" | "Q&A";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

/* =========================================================
   QUESTIONS
   ========================================================= */


/* =========================================================
   PAGE
   ========================================================= */

function SubjectPage() {
  const { courseId } = Route.useParams();
  return <SubjectContent key={courseId} />;
}

function SubjectContent() {
  const { courseId } = Route.useParams();

  const course = useMemo(
    () =>
      courses.find(
        (c) => c.id.toLowerCase() === courseId.toLowerCase(),
      ),
    [courseId],
  );

  const fetchContent = useServerFn(getCourseContent);
  type Content = Awaited<ReturnType<typeof getCourseContent>>;
  const [content, setContent] = useState<Content | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [videoIdx, setVideoIdx] = useState(0);
  const [pdfIdx, setPdfIdx] = useState(0);
  useEffect(() => {
    let live = true;
    fetchContent({ data: { courseId: courseId.toLowerCase() } })
      .then((c) => live && setContent(c))
      .catch((e: Error) => live && setLoadError(e.message));
    return () => { live = false; };
  }, [courseId, fetchContent]);
  const QUESTIONS: Question[] = content?.questions ?? [];
  const currentVideo = content?.videos[videoIdx];
  const currentPdf = content?.pdfs[pdfIdx];
  const blockSave = (e: React.SyntheticEvent) => e.preventDefault();

  const [activeTab, setActiveTab] = useState<Tab>("Videos");
  const [isSaved, setIsSaved] = useState(false);
  useFocusTimer(true);

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showExplanations, setShowExplanations] = useState<
    Record<number, boolean>
  >({});

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  const [videoError, setVideoError] = useState(false);
  const [videoAttempt, setVideoAttempt] = useState(0);

  /*
   * VideoJS internally renders the real HTMLVideoElement.
   * We keep the wrapper so we can access it for watch tracking.
   */
  const videoWrapRef = useRef<HTMLDivElement>(null);

  const watchedRef = useRef(0);
  const minuteCarryRef = useRef(0);

  /* =========================================================
     SAVED VIDEO STATE
     ========================================================= */

  useEffect(() => {
    const savedVideos = JSON.parse(
      localStorage.getItem("janaprvt_saved_videos") || "[]",
    );

    setIsSaved(savedVideos.includes(courseId.toLowerCase()));
  }, [courseId]);

  /* =========================================================
     SUBJECT ACTIVITY
     ========================================================= */

  useEffect(() => {
    recordSubject(courseId, {
      quizTotal: QUESTIONS.length,
    });
  }, [courseId, QUESTIONS.length]);

  /* =========================================================
     VIDEO WATCH TRACKING
     ========================================================= */

  useEffect(() => {
    if (activeTab !== "Videos") return;

    const el =
      videoWrapRef.current?.querySelector<HTMLVideoElement>("video");

    if (!el) return;

    let last = el.currentTime;

    const onTime = () => {
      const delta = el.currentTime - last;
      last = el.currentTime;

      if (delta <= 0 || delta > 2 || el.paused) return;

      watchedRef.current += delta;
      minuteCarryRef.current += delta;

      if (watchedRef.current % 5 < delta) {
        recordSubject(courseId, {
          watchedSeconds: Math.round(watchedRef.current),
          durationSeconds: Math.round(el.duration || 0),
        });
      }

      if (minuteCarryRef.current >= 60) {
        const mins = Math.floor(minuteCarryRef.current / 60);

        minuteCarryRef.current -= mins * 60;

        recordMinutes(mins);
      }
    };

    const onLoaded = () => {
      setVideoError(false);

      recordSubject(courseId, {
        durationSeconds: Math.round(el.duration || 0),
      });
    };

    const onError = () => {
      setVideoError(true);
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("error", onError);

    if (el.error) {
      setVideoError(true);
    }

    const readinessCheck = window.setTimeout(() => {
      if (
        el.error ||
        el.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
      ) {
        setVideoError(true);
      }
    }, 1500);

    return () => {
      window.clearTimeout(readinessCheck);

      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("error", onError);

      if (watchedRef.current > 0) {
        recordSubject(courseId, {
          watchedSeconds: Math.round(watchedRef.current),
          durationSeconds: Math.round(el.duration || 0),
        });
      }
    };
  }, [activeTab, courseId, videoAttempt, currentVideo?.id]);

  /* =========================================================
     PDF PROGRESS
     ========================================================= */

  const handlePdfProgress = useCallback(
    (pagesRendered: number, totalPages: number) => {
      recordSubject(courseId, {
        pagesRead: pagesRendered,
        totalPages,
      });
    },
    [courseId],
  );

  /* =========================================================
     SAVE / UNSAVE
     ========================================================= */

  const toggleSave = () => {
    const savedVideos = JSON.parse(
      localStorage.getItem("janaprvt_saved_videos") || "[]",
    );

    let newSaved;

    if (isSaved) {
      newSaved = savedVideos.filter(
        (id: string) => id !== courseId,
      );
    } else {
      newSaved = [...savedVideos, courseId];
    }

    localStorage.setItem(
      "janaprvt_saved_videos",
      JSON.stringify(newSaved),
    );

    setIsSaved(!isSaved);
  };

  /* =========================================================
     QUIZ
     ========================================================= */

  const handleSelectOption = (
    qId: number,
    optionIdx: number,
  ) => {
    setAnswers((prev) => {
      const next = {
        ...prev,
        [qId]: optionIdx,
      };

      const correct = QUESTIONS.filter(
        (q) => next[q.id] === q.correctAnswer,
      ).length;

      recordSubject(courseId, {
        quizAnswered: Object.keys(next).length,
        quizCorrect: correct,
        quizTotal: QUESTIONS.length,
      });

      return next;
    });

    setShowExplanations((prev) => ({
      ...prev,
      [qId]: true,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < QUESTIONS.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    }
  };

  const currentQuestion = QUESTIONS[currentQuestionIdx];

  if (!course) {
    return (
      <div className="p-12 text-center">
        Subject not found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pt-2 max-w-full overflow-x-hidden flex-1">
      {/* =====================================================
          TOP NAVBAR
         ===================================================== */}

      <nav className="sticky top-2 z-30 flex h-11 w-full shrink-0 items-center gap-1 rounded-2xl px-1 glass-flat">
        <Link
          to="/courses"
          aria-label="Back to courses"
          className="flex size-8 shrink-0 items-center justify-center rounded-xl text-primary transition-transform active:scale-90"
        >
          <ChevronLeft
            className="size-5"
            strokeWidth={2.5}
          />
        </Link>

        {(["Videos", "PDFs", "Q&A"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative flex h-8 flex-1 items-center justify-center text-[0.875rem] font-semibold transition-all duration-300",
              activeTab === tab
                ? "text-primary"
                : "text-muted-foreground/80",
            )}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="activeTabSubject"
                className="absolute inset-0 z-0 rounded-xl bg-primary/10"
                transition={spring}
              />
            )}

            <span className="relative z-10">
              {tab}
            </span>
          </button>
        ))}
      </nav>

      <div className="mt-1 pb-32 flex-1 flex flex-col">
        <AnimatePresence mode="sync" initial={false}>
          {/* =================================================
              VIDEO TAB
             ================================================= */}

          {activeTab === "Videos" && (
            <motion.div
              key="videos"
              initial={{
                opacity: 0,
                scale: 0.98,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.98,
                y: -10,
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className="flex flex-col gap-6"
            >
              {loadError && (
                <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-[0.875rem] font-medium text-destructive">{loadError}</p>
              )}
              <div
                ref={videoWrapRef}
                onContextMenu={blockSave}
                onDragStart={blockSave}
                className="relative aspect-video w-full select-none overflow-hidden rounded-[20px] bg-secondary"
              >
                {currentVideo ? (
                  <VideoPlayer key={`${currentVideo.id}-${videoAttempt}`}>
                    <VideoSkin>
                      <Video
                        src={currentVideo.url}
                        playsInline
                        preload="metadata"
                        controlsList="nodownload noremoteplayback"
                        disablePictureInPicture
                        disableRemotePlayback
                      />
                    </VideoSkin>
                  </VideoPlayer>
                ) : (
                  <div className="grid h-full place-items-center px-6 text-center text-[0.875rem] font-medium text-muted-foreground">
                    {content ? "No lectures yet." : loadError ? "Unavailable" : "Loading…"}
                  </div>
                )}
                <Watermark text={content?.viewer ?? ""} />

                {videoError && (
                  <div
                    role="alert"
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/95 px-6 text-center"
                  >
                    <AlertCircle
                      className="size-6 text-destructive"
                      aria-hidden="true"
                    />

                    <div>
                      <p className="font-semibold text-foreground">
                        Video unavailable
                      </p>

                      <p className="mt-1 text-[0.8125rem] font-medium text-muted-foreground">
                        The lesson couldn't be loaded. Check
                        your connection and try again.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setVideoError(false);
                        setVideoAttempt(
                          (value) => value + 1,
                        );
                      }}
                    >
                      <RotateCw aria-hidden="true" />
                      Try again
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 px-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold tracking-tight break-words flex-1">
                    {course.title}
                  </h2>

                  <button
                    onClick={toggleSave}
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-2xl clay transition-all duration-300 active:scale-90 border border-white/50",
                      isSaved
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                    aria-label={
                      isSaved
                        ? "Remove from saved"
                        : "Save video"
                    }
                  >
                    <Bookmark
                      className={cn(
                        "size-5",
                        isSaved && "fill-current",
                      )}
                    />
                  </button>
                </div>

                <p className="text-[0.875rem] text-muted-foreground/90 leading-relaxed font-medium w-full whitespace-pre-line">
                  {content?.description || `Lectures for ${course.title}.`}
                </p>
                {content && content.videos.length > 1 && (
                  <div className="flex flex-col gap-2">
                    {content.videos.map((v, i) => (
                      <button
                        key={v.id}
                        onClick={() => setVideoIdx(i)}
                        className={cn("clay rounded-2xl px-4 py-3 text-left text-[0.875rem] font-semibold", i === videoIdx ? "text-primary" : "text-foreground")}
                      >
                        {i + 1}. {v.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* =================================================
              PDF TAB
             ================================================= */}

          {activeTab === "PDFs" && (
            <motion.div
              key="pdfs"
              initial={{
                opacity: 0,
                scale: 0.98,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.98,
                y: -10,
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className="flex flex-col gap-4 flex-1"
            >
              <div className="flex w-full flex-1 flex-col min-h-[60vh]">
                {content && content.pdfs.length > 1 && (
                  <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                    {content.pdfs.map((p, i) => (
                      <button key={p.id} onClick={() => setPdfIdx(i)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold", i === pdfIdx ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                        {p.title}
                      </button>
                    ))}
                  </div>
                )}
                {currentPdf ? (
                  <PdfViewer
                    key={currentPdf.id}
                    src={currentPdf.url}
                    viewer={content?.viewer}
                    className="w-full flex-1"
                    onProgress={handlePdfProgress}
                  />
                ) : (
                  <p className="py-10 text-center text-[0.875rem] font-medium text-muted-foreground">
                    {loadError ?? (content ? "No PDFs yet." : "Loading…")}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* =================================================
              Q&A TAB
             ================================================= */}

          {activeTab === "Q&A" && !currentQuestion && (
            <motion.p key="qa-empty" className="py-10 text-center text-[0.875rem] font-medium text-muted-foreground">
              {loadError ?? (content ? "No questions yet." : "Loading…")}
            </motion.p>
          )}
          {activeTab === "Q&A" && currentQuestion && (
            <motion.div
              key="qa"
              initial={{
                opacity: 0,
                scale: 0.98,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.98,
                y: -10,
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className="flex flex-col gap-5"
            >
              <header className="flex flex-wrap items-end justify-between gap-2 px-1">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[1.0625rem] font-bold sm:text-lg">
                    Knowledge Check
                  </h3>

                  <p className="truncate text-[0.8125rem] font-medium text-muted-foreground sm:text-[0.875rem]">
                    Topic: {course.title}
                  </p>
                </div>

                <div className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[0.6875rem] font-black uppercase tracking-wider text-primary sm:text-[0.75rem]">
                  {currentQuestionIdx + 1} / {QUESTIONS.length}
                </div>
              </header>

              <div className="flex flex-col gap-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion.id}
                    initial={{
                      opacity: 0,
                      x: 20,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -20,
                    }}
                    className="w-full overflow-hidden glass-flat rounded-3xl sm:rounded-[2rem]"
                  >
                    <div className="border-b border-primary/10 bg-primary/5 px-4 py-4 sm:px-5 sm:py-5">
                      <p className="text-[1rem] font-bold leading-snug break-words sm:text-[1.125rem]">
                        {currentQuestion.question}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 p-3 sm:gap-2.5 sm:p-4">
                      {currentQuestion.options.map(
                        (option, idx) => {
                          const isSelected =
                            answers[currentQuestion.id] ===
                            idx;

                          const isCorrect =
                            idx ===
                            currentQuestion.correctAnswer;

                          const hasAnswered =
                            answers[currentQuestion.id] !==
                            undefined;

                          return (
                            <button
                              key={idx}
                              disabled={hasAnswered}
                              onClick={() =>
                                handleSelectOption(
                                  currentQuestion.id,
                                  idx,
                                )
                              }
                              className={cn(
                                "relative flex items-center justify-between gap-2.5 rounded-2xl border-2 px-3.5 py-3 text-left text-[0.875rem] font-semibold leading-snug transition-all sm:px-4 sm:py-3.5 sm:text-[0.9375rem]",

                                !hasAnswered &&
                                  "border-transparent bg-secondary/50 active:scale-[0.98] active:bg-secondary/80",

                                hasAnswered &&
                                  isCorrect &&
                                  "border-mint bg-mint/10 text-mint-foreground",

                                hasAnswered &&
                                  isSelected &&
                                  !isCorrect &&
                                  "border-destructive bg-destructive/10 text-destructive-foreground",

                                hasAnswered &&
                                  !isSelected &&
                                  !isCorrect &&
                                  "border-transparent opacity-60",
                              )}
                            >
                              <span className="min-w-0 flex-1 break-words">
                                {option}
                              </span>

                              {hasAnswered && isCorrect && (
                                <div className="flex size-5 items-center justify-center rounded-full bg-mint text-white">
                                  <svg
                                    className="size-3 fill-current"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        },
                      )}
                    </div>

                    <AnimatePresence>
                      {showExplanations[
                        currentQuestion.id
                      ] && (
                        <motion.div
                          initial={{
                            height: 0,
                            opacity: 0,
                          }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                          }}
                          className="border-t border-primary/10 bg-primary/5 px-4 py-3.5 sm:px-5 sm:py-4"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 text-primary">
                              <MessageSquare className="size-4" />
                            </div>

                            <p className="text-[0.8125rem] font-medium italic leading-relaxed text-muted-foreground sm:text-[0.875rem]">
                              {currentQuestion.explanation}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Previous / Next Controls */}

              <div className="flex items-center justify-between gap-2 px-1">
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestionIdx === 0}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-secondary/50 px-3 py-2.5 text-[0.8125rem] font-bold text-foreground transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-30 sm:text-[0.875rem]"
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </button>

                <button
                  onClick={nextQuestion}
                  disabled={
                    currentQuestionIdx ===
                    QUESTIONS.length - 1
                  }
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-secondary/50 px-3 py-2.5 text-[0.8125rem] font-bold text-foreground transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-30 sm:text-[0.875rem]"
                >
                  Next
                  <ChevronRight className="size-4" />
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
