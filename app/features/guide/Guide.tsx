"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { StatusPill } from "../../components/ui";
import { useModalFocus } from "../workshop-prototype/useModalFocus";
import { CUSTOMER_PAGE_GUIDES, HOW_TO_TOPICS, STAFF_PAGE_GUIDES } from "./content";

const STARTER_TOPICS = ["create-job", "add-customer", "move-job", "follow-up", "customer-view", "c-kilometres", "c-service", "c-problem"];
import type { CustomerPageId, GuideAudience, HowToTopic, StaffPageId, TourStep } from "./content";
import { searchHowTo, topicsForPage } from "./search";

// ---- Progress: whether this browser has seen the welcome and finished each tour ----

const PROGRESS_KEY = "jb-motors-guide.v1";
type GuideProgress = { staffWelcomed?: boolean; staffTourDone?: boolean; customerTourDone?: boolean };
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedProgress: GuideProgress = {};

function readProgress(): GuideProgress {
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(PROGRESS_KEY); } catch { raw = null; }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try { cachedProgress = raw ? JSON.parse(raw) as GuideProgress : {}; } catch { cachedProgress = {}; }
  }
  return cachedProgress;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => { listeners.delete(listener); window.removeEventListener("storage", listener); };
}

/** Returns null during server rendering so first-visit prompts never flash before the browser is checked. */
export function useGuideProgress() {
  const progress = useSyncExternalStore(subscribe, readProgress, () => null);
  const update = (patch: GuideProgress) => {
    // If storage is blocked the guide still works for this visit; it may simply reappear next time.
    try { window.localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...readProgress(), ...patch })); } catch { /* ignore */ }
    cachedRaw = undefined;
    listeners.forEach((listener) => listener());
  };
  return [progress, update] as const;
}

// ---- Welcome dialog ----

export function WelcomeDialog({ audience, onTour, onSkip }: { audience: GuideAudience; onTour: () => void; onSkip: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useModalFocus(ref, onSkip);
  const staff = audience === "staff";
  return <div className="dialog-backdrop" role="presentation"><div className="creation-dialog guide-welcome" role="dialog" aria-modal="true" aria-labelledby="guide-welcome-title" ref={ref}>
    <header><div><span className="section-kicker">{staff ? "WELCOME TO JB MOTORS" : "WELCOME"}</span><h2 id="guide-welcome-title">{staff ? "Your digital workshop" : "Your vehicle, looked after"}</h2></div></header>
    <div className="guide-welcome-body">
      {staff ? <>
        <p>This platform keeps customers, vehicles, job cards and follow-ups in one place.</p>
        <ul><li><strong>Dashboard</strong> shows what needs attention today.</li><li><strong>Demo role</strong> lets you see each staff member’s screens.</li><li><strong>Customer portal</strong> shows what your customers see.</li><li><strong>Help</strong> explains every page and answers “Ask me how” questions.</li></ul>
        <p className="guide-note">This is a demo: there are no logins yet, figures marked “sample” are made up, and anything you enter stays on this device.</p>
      </> : <>
        <p>Keep track of your vehicle’s service, request a booking and tell the workshop about any problems.</p>
        <p className="guide-note">Demo: changes are saved only on this device.</p>
      </>}
    </div>
    <footer className="guide-actions"><button type="button" className="secondary-button" onClick={onSkip}>Explore on my own</button><button type="button" className="primary-button" onClick={onTour}>Take the quick tour</button></footer>
  </div></div>;
}

// ---- Help panel with "Ask me how" ----

export function HelpPanel({ audience, page, onClose, onOpenTopic, onStartTour }: { audience: GuideAudience; page: string; onClose: () => void; onOpenTopic: (topic: HowToTopic) => void; onStartTour: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<HowToTopic | null>(null);
  useModalFocus(ref, onClose);
  const guide = audience === "staff" ? STAFF_PAGE_GUIDES[page as StaffPageId] : CUSTOMER_PAGE_GUIDES[page as CustomerPageId];
  const pageTopics = topicsForPage(page, audience);
  // Pages without their own tasks (e.g. the dashboard) show the most common starting points instead.
  const starters = HOW_TO_TOPICS.filter((item) => STARTER_TOPICS.includes(item.id) && item.audience === audience);
  const results = query.trim() ? searchHowTo(query, audience) : pageTopics.length ? pageTopics : starters;
  return <div className="help-layer"><button type="button" className="help-backdrop" aria-label="Close help" onClick={onClose} /><aside className="help-panel" role="dialog" aria-modal="true" aria-labelledby="help-title" ref={ref}>
    <header><div><span className="section-kicker">HELP & GUIDE</span><h2 id="help-title">{topic ? topic.title : "How can we help?"}</h2></div><button type="button" aria-label="Close help" onClick={onClose}>×</button></header>
    {topic ? <div className="help-body">
      <button type="button" className="text-button" onClick={() => setTopic(null)}>← Back</button>
      {topic.status === "coming-soon" && <StatusPill tone="amber">COMING SOON</StatusPill>}
      <ol className="help-steps">{topic.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      {topic.status === "available" && topic.page && topic.page !== page && <button type="button" className="primary-button" onClick={() => onOpenTopic(topic)}>Take me there</button>}
    </div> : <div className="help-body">
      <form className="help-search" role="search" onSubmit={(event) => event.preventDefault()}><label><span>Ask me how…</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={audience === "staff" ? "e.g. create a job card" : "e.g. update my kilometres"} autoComplete="off" /></label></form>
      {!query.trim() && guide && <section className="help-page"><span className="section-kicker">ABOUT THIS PAGE</span><h3>{guide.title}</h3><p>{guide.summary}</p>{guide.youCan.length > 0 && <><strong>Here you can:</strong><ul>{guide.youCan.map((item) => <li key={item}>{item}</li>)}</ul></>}</section>}
      <section aria-live="polite"><span className="section-kicker">{query.trim() ? "MATCHING INSTRUCTIONS" : pageTopics.length ? "COMMON TASKS ON THIS PAGE" : "POPULAR TASKS"}</span>
        {results.length === 0 ? <p className="help-empty">{query.trim() ? "No instructions match yet. Try other words, such as “job card”, “customer” or “kilometres”." : "Type a question above to find step-by-step instructions."}</p>
          : <ul className="help-results">{results.map((item) => <li key={item.id}><button type="button" onClick={() => setTopic(item)}><span>{item.title}</span>{item.status === "coming-soon" ? <StatusPill tone="amber">COMING SOON</StatusPill> : <b aria-hidden="true">→</b>}</button></li>)}</ul>}
      </section>
    </div>}
    <footer><button type="button" className="secondary-button" onClick={onStartTour}>Take the quick tour again</button></footer>
  </aside></div>;
}

// ---- Guided tour ----

const isVisible = (element: Element) => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; };
const findTarget = (step: TourStep) => step.targets.map((selector) => document.querySelector(selector)).find((element): element is Element => Boolean(element && isVisible(element)));

export function GuideTour({ steps, onFinish }: { steps: TourStep[]; onFinish: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = steps[index];
  const last = index === steps.length - 1;
  useLayoutEffect(() => {
    const target = findTarget(step);
    target?.scrollIntoView({ block: "nearest" });
    const measure = () => setRect(findTarget(step)?.getBoundingClientRect() ?? null);
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); };
  }, [step]);
  useEffect(() => { cardRef.current?.focus(); }, [index]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onFinish(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onFinish]);
  const pad = 6;
  const below = rect ? rect.bottom + 180 < window.innerHeight : true;
  const cardStyle = rect ? { top: below ? rect.bottom + pad + 10 : undefined, bottom: below ? undefined : window.innerHeight - rect.top + pad + 10, left: Math.min(Math.max(12, rect.left), window.innerWidth - 332) } : undefined;
  return <div className="tour-layer" role="dialog" aria-modal="true" aria-labelledby="tour-title">
    {rect ? <div className="tour-highlight" style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} /> : <div className="tour-dim" />}
    <div className={`tour-card ${rect ? "" : "centred"}`} style={cardStyle} ref={cardRef} tabIndex={-1}>
      <span className="section-kicker">QUICK TOUR · {index + 1} OF {steps.length}</span>
      <h2 id="tour-title">{step.title}</h2>
      <p>{step.text}</p>
      <div className="tour-actions"><button type="button" className="text-button" onClick={onFinish}>Skip tour</button><span>{index > 0 && <button type="button" className="secondary-button" onClick={() => setIndex(index - 1)}>Back</button>}<button type="button" className="primary-button" onClick={() => last ? onFinish() : setIndex(index + 1)}>{last ? "Finish" : "Next"}</button></span></div>
    </div>
  </div>;
}
