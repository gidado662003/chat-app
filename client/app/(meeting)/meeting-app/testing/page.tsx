"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";

type RecordingState = "idle" | "recording" | "stopped";

interface Recording {
  id: string;
  url: string;
  duration: number;
  timestamp: Date;
  blob: Blob;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function formatDate(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AudioRecorder() {
  const [state, setState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [volume, setVolume] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopVolumeMonitor = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setVolume(0);
  }, []);

  const startVolumeMonitor = useCallback((analyser: AnalyserNode) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setVolume(avg / 128);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Pick the best supported MIME type
      const mimeType =
        [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
          "audio/ogg",
          "audio/mp4",
        ].find((m) => MediaRecorder.isTypeSupported(m)) || "";

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const type = mr.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const url = URL.createObjectURL(blob);
        const duration = (Date.now() - startTimeRef.current) / 1000;
        setRecordings((prev) => [
          {
            id: crypto.randomUUID(),
            url,
            duration,
            timestamp: new Date(),
            blob,
          },
          ...prev,
        ]);
        stream.getTracks().forEach((t) => t.stop());
        stopVolumeMonitor();
      };

      mr.start(250); // collect a chunk every 250ms
      startTimeRef.current = Date.now();
      setState("recording");

      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      startVolumeMonitor(analyser);
    } catch (err) {
      console.error("Mic error:", err);
    }
  }, [startVolumeMonitor, stopVolumeMonitor]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState("stopped");
    setElapsed(0);
  }, []);

  const deleteRecording = useCallback((id: string) => {
    setRecordings((prev) => {
      const rec = prev.find((r) => r.id === id);
      if (rec) URL.revokeObjectURL(rec.url);
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  const downloadRecording = useCallback((rec: Recording) => {
    const a = document.createElement("a");
    a.href = rec.url;
    a.download = `recording-${rec.timestamp.toISOString()}.webm`;
    a.click();
  }, []);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const bars = 28;
  const isRecording = state === "recording";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #0a0a0a; }

        .recorder-root {
          min-height: 100vh;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          padding: 24px;
        }

        .recorder-card {
          width: 100%;
          max-width: 480px;
          background: #111;
          border: 1px solid #222;
          border-radius: 4px;
          overflow: hidden;
        }

        .recorder-header {
          padding: 24px 28px 20px;
          border-bottom: 1px solid #1e1e1e;
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .recorder-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px;
          letter-spacing: 3px;
          color: #f0f0f0;
          line-height: 1;
        }

        .recorder-subtitle {
          font-size: 10px;
          color: #444;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .recorder-main {
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
        }

        .timer-display {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 72px;
          letter-spacing: 6px;
          color: ${isRecording ? "#e83030" : "#2a2a2a"};
          transition: color 0.3s ease;
          line-height: 1;
          user-select: none;
        }

        .viz-container {
          display: flex;
          align-items: center;
          gap: 3px;
          height: 48px;
        }

        .viz-bar {
          width: 3px;
          border-radius: 2px;
          background: #222;
          transition: height 0.08s ease, background 0.3s ease;
          animation: ${isRecording ? "none" : "idle-pulse 2s ease-in-out infinite"};
        }

        @keyframes idle-pulse {
          0%, 100% { height: 3px; }
          50% { height: 6px; }
        }

        .btn-record {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 2px solid #333;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s, transform 0.1s;
          position: relative;
        }

        .btn-record:hover {
          border-color: #555;
          transform: scale(1.04);
        }

        .btn-record:active { transform: scale(0.97); }

        .btn-inner {
          width: 40px;
          height: 40px;
          border-radius: ${isRecording ? "6px" : "50%"};
          background: ${isRecording ? "#e83030" : "#e83030"};
          transition: border-radius 0.25s ease, transform 0.25s ease;
          transform: ${isRecording ? "scale(0.72)" : "scale(1)"};
        }

        .pulse-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1.5px solid #e83030;
          opacity: 0;
          animation: ${isRecording ? "pulse-ring 1.5s ease-out infinite" : "none"};
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        .status-text {
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: ${isRecording ? "#e83030" : "#333"};
          transition: color 0.3s;
        }

        .recordings-section {
          border-top: 1px solid #1a1a1a;
        }

        .recordings-header {
          padding: 14px 28px;
          font-size: 9px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #333;
          border-bottom: 1px solid #1a1a1a;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .recordings-count {
          background: #1e1e1e;
          color: #555;
          padding: 2px 7px;
          border-radius: 2px;
          font-size: 9px;
        }

        .recordings-list {
          max-height: 280px;
          overflow-y: auto;
        }

        .recordings-list::-webkit-scrollbar { width: 3px; }
        .recordings-list::-webkit-scrollbar-track { background: transparent; }
        .recordings-list::-webkit-scrollbar-thumb { background: #222; }

        .recording-item {
          padding: 14px 28px;
          border-bottom: 1px solid #161616;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: background 0.15s;
        }

        .recording-item:hover { background: #141414; }
        .recording-item:last-child { border-bottom: none; }

        .recording-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .recording-time {
          font-size: 10px;
          color: #444;
          letter-spacing: 1px;
        }

        .recording-duration {
          font-size: 13px;
          color: #666;
          letter-spacing: 1px;
        }

        .recording-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        audio {
          width: 100%;
          height: 28px;
          filter: invert(1) brightness(0.4);
          border-radius: 2px;
        }

        .icon-btn {
          background: none;
          border: 1px solid #222;
          color: #444;
          width: 28px;
          height: 28px;
          border-radius: 3px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          transition: border-color 0.15s, color 0.15s;
          flex-shrink: 0;
        }

        .icon-btn:hover { border-color: #444; color: #888; }
        .icon-btn.danger:hover { border-color: #e83030; color: #e83030; }

        .empty-state {
          padding: 32px 28px;
          text-align: center;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #282828;
        }
      `}</style>

      <div className="recorder-root">
        <div className="recorder-card">
          <div className="recorder-header">
            <span className="recorder-title">REC</span>
            <span className="recorder-subtitle">Voice Recorder</span>
          </div>

          <div className="recorder-main">
            <div className="timer-display">{formatTime(elapsed)}</div>

            {/* Waveform visualizer */}
            <div className="viz-container">
              {Array.from({ length: bars }).map((_, i) => {
                const center = bars / 2;
                const dist = Math.abs(i - center) / center;
                const baseH = isRecording
                  ? Math.max(
                      3,
                      volume *
                        48 *
                        (1 - dist * 0.6) *
                        (0.5 + Math.random() * 0.5),
                    )
                  : 3;
                return (
                  <div
                    key={i}
                    className="viz-bar"
                    style={{
                      height: `${baseH}px`,
                      background: isRecording
                        ? `rgba(232, 48, 48, ${0.4 + volume * 0.6})`
                        : "#1e1e1e",
                      animationDelay: `${(i / bars) * 2}s`,
                    }}
                  />
                );
              })}
            </div>

            {/* Record button */}
            <button
              className="btn-record"
              onClick={isRecording ? stopRecording : startRecording}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              <div className="pulse-ring" />
              <div className="btn-inner" />
            </button>

            <span className="status-text">
              {isRecording ? "● recording" : "tap to record"}
            </span>
          </div>

          <div className="recordings-section">
            <div className="recordings-header">
              <span>Recordings</span>
              <span className="recordings-count">{recordings.length}</span>
            </div>

            <div className="recordings-list">
              {recordings.length === 0 ? (
                <div className="empty-state">No recordings yet</div>
              ) : (
                recordings.map((rec) => (
                  <div key={rec.id} className="recording-item">
                    <div className="recording-meta">
                      <span className="recording-time">
                        {formatDate(rec.timestamp)}
                      </span>
                      <span className="recording-duration">
                        {formatTime(rec.duration)}
                      </span>
                    </div>
                    <div className="recording-actions">
                      <audio
                        controls
                        src={rec.url}
                        onPlay={() => setPlayingId(rec.id)}
                        onPause={() => setPlayingId(null)}
                        onEnded={() => setPlayingId(null)}
                      />
                      <button
                        className="icon-btn"
                        onClick={() => downloadRecording(rec)}
                        title="Download"
                      >
                        ↓
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => deleteRecording(rec.id)}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
