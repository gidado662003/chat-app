"use client";
import React, { useEffect, useState } from "react";

function Page() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);

  useEffect(() => {
    // Only run in the browser
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Browser does not support getUserMedia API");
      return;
    }

    let mediaRecorder: MediaRecorder;
    let audioChunks: Blob[] = [];

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (e) => {
          audioChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          const url = URL.createObjectURL(audioBlob);
          setAudioURL(url);
          audioChunks = [];
        };

        mediaRecorder.start();
        setRecording(true);

        setTimeout(() => {
          mediaRecorder.stop();
          setRecording(false);
        }, 5000);
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    };

    startRecording();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Mic Test</h1>
      {recording ? <p>Recording...</p> : <p>Recording stopped</p>}
      {audioURL && <audio controls src={audioURL}></audio>}
    </div>
  );
}

export default Page;
