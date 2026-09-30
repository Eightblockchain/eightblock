'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const HEARTBEAT_MS = 30_000;
/** Set from the admin app so the team's own visits are not counted. */
const IGNORE_KEY = 'eb_analytics_ignore';
/** The admin app lives on another origin, so it hands the choice over as `?eb_analytics=off|on`. */
const PREFERENCE_PARAM = 'eb_analytics';
/** Fired on window with the article's current view count, fresher than the cached page. */
export const ARTICLE_VIEW_COUNT = 'eb:article-view-count';
export type ArticleViewCountDetail = { path: string; viewCount: number };

type CollectResponse = { id: string; counted?: boolean; viewCount?: number };

const isStudio = (path: string) =>
  path === '/articles/new' || /^\/articles\/[^/]+\/edit$/.test(path);

/** Saves a preference passed in the URL and removes it; true when one was found. */
function takePreference() {
  const url = new URL(window.location.href);
  const value = url.searchParams.get(PREFERENCE_PARAM);
  if (value !== 'off' && value !== 'on') return false;
  try {
    if (value === 'off') localStorage.setItem(IGNORE_KEY, '1');
    else localStorage.removeItem(IGNORE_KEY);
  } catch {
    // Storage is blocked; nothing to remember.
  }
  url.searchParams.delete(PREFERENCE_PARAM);
  window.history.replaceState(window.history.state, '', url.toString());
  return true;
}

function ignored() {
  try {
    return localStorage.getItem(IGNORE_KEY) === '1' || navigator.webdriver;
  } catch {
    return false;
  }
}

function scrollDepth() {
  const doc = document.documentElement;
  const scrollable = doc.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 100;
  return Math.min(100, Math.round((window.scrollY / scrollable) * 100));
}

/** text/plain keeps these simple requests: no CORS preflight, and beacons are allowed. */
function send(path: string, body: object, beacon = false) {
  const url = `${API_URL}${path}`;
  const json = JSON.stringify(body);
  if (beacon && navigator.sendBeacon?.(url, new Blob([json], { type: 'text/plain' }))) {
    return Promise.resolve(null);
  }
  return fetch(url, {
    method: 'POST',
    body: json,
    credentials: 'include',
    keepalive: true,
    headers: { 'Content-Type': 'text/plain' },
  })
    .then((res) => (res.status === 201 ? (res.json() as Promise<CollectResponse>) : null))
    .catch(() => null);
}

/**
 * Records one page view per route change, then reports engaged time (only while the tab is
 * visible) and scroll depth with a heartbeat and when the reader leaves.
 */
export function PageTracker() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const firstLoad = useRef(true);
  const current = useRef<{ path: string; at: number; view: Promise<{ id: string } | null> } | null>(
    null
  );

  useEffect(() => {
    const path = search ? `${pathname}?${search}` : pathname;
    if (takePreference() || isStudio(pathname) || ignored()) return;

    let viewId: string | null = null;
    let engaged = 0;
    let visibleSince: number | null = document.visibilityState === 'visible' ? Date.now() : null;
    let deepest = scrollDepth();

    const seconds = () =>
      Math.round((engaged + (visibleSince ? Date.now() - visibleSince : 0)) / 1000);
    const report = (beacon = false) => {
      if (viewId)
        send(`/analytics/collect/${viewId}`, { duration: seconds(), scrollDepth: deepest }, beacon);
    };

    const params = new URLSearchParams(window.location.search);
    const utm = {
      source: params.get('utm_source') ?? params.get('ref') ?? undefined,
      medium: params.get('utm_medium') ?? undefined,
      campaign: params.get('utm_campaign') ?? undefined,
    };
    // Development mode runs effects twice; the second run belongs to the same page view.
    const reuse = current.current?.path === path && Date.now() - current.current.at < 2000;
    if (!reuse) {
      current.current = {
        path,
        at: Date.now(),
        view: send('/analytics/collect', {
          path,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...(firstLoad.current && { referrer: document.referrer || undefined, utm }),
        }).then((res) => {
          if (typeof res?.viewCount === 'number') {
            window.dispatchEvent(
              new CustomEvent<ArticleViewCountDetail>(ARTICLE_VIEW_COUNT, {
                detail: { path: pathname, viewCount: res.viewCount },
              })
            );
          }
          return res;
        }),
      };
      firstLoad.current = false;
    }
    current.current!.view.then((res) => {
      viewId = res?.id ?? null;
    });

    const onScroll = () => {
      deepest = Math.max(deepest, scrollDepth());
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (visibleSince) engaged += Date.now() - visibleSince;
        visibleSince = null;
        report(true);
      } else {
        visibleSince = Date.now();
      }
    };
    const onPageHide = () => report(true);
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === 'visible') report();
    }, HEARTBEAT_MS);

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      report(true);
      window.clearInterval(heartbeat);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [pathname, search]);

  return null;
}
