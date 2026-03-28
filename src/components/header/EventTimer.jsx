import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function EventTimer() {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadEventTime();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const loadEventTime = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return;

      // Events laden - wenn keine da oder Fehler, einfach nichts anzeigen
      let events = [];
      try {
        events = await base44.entities.AppEvent.filter({ is_active: true });
      } catch (e) {
        return; // Kein Event = kein Timer
      }
      
      if (!events || events.length === 0) return;

      const event = events[0];
      if (!event.start_date || !event.end_date) return;
      
      const now = new Date();
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);
      if (now < eventStart || now > eventEnd) return;

      // Sessions nur laden wenn Event aktiv
      let seconds = 0;
      try {
        const user = await base44.auth.me();
        if (!user) return;
        const sessions = await base44.entities.UsageSession.filter({ user_id: user.id });
        for (const session of sessions) {
          const start = new Date(session.started_at);
          if (start < eventStart || start > eventEnd) continue;
          if (session.status === 'stopped' && session.stopped_at) {
            seconds += Math.floor((new Date(session.stopped_at) - start) / 1000);
          } else if (session.status === 'active') {
            seconds += Math.floor((new Date() - start) / 1000);
          }
        }
      } catch (e) {
        // Sessions nicht verfügbar - Timer trotzdem anzeigen mit 0
      }

      setTotalSeconds(seconds);
      setVisible(true);
      intervalRef.current = setInterval(() => {
        setTotalSeconds(prev => prev + 1);
      }, 1000);
    } catch (error) {
      // Kein Fehler anzeigen - Timer bleibt versteckt
    }
  };

  if (!visible) return null;

  return (
    <Link to={createPageUrl("Events")} className="flex items-center gap-1 text-xs text-cyan-400 font-mono bg-cyan-400/10 px-2 py-1 rounded-full border border-cyan-400/30">
      <span>⏱</span>
      <span>{formatTime(totalSeconds)}</span>
    </Link>
  );
}

export default EventTimer;
