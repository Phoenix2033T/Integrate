"use client";

import { useEffect, useRef, useState } from "react";
import { loadMediaBlob } from "../lib/mediaStore";
import type { NoteAttachment } from "../lib/types";

type Props = {
  attachment: NoteAttachment;
  onTimeChange?: (absoluteTime: number | null) => void;
};

export default function AudioAttachment({ attachment, onTimeChange }: Props) {
  const [url, setUrl] = useState<string | null>(attachment.dataUrl || null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (attachment.dataUrl) return;
    let active = true;
    let objectUrl: string | null = null;
    void loadMediaBlob(attachment.id).then((blob) => {
      if (!active || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id, attachment.dataUrl]);

  return (
    <div className="audioAttachment">
      <div className="audioAttachmentTitle">
        <span className="audioBadge">●</span>
        <span><strong>{attachment.name}</strong><small>{attachment.durationMs ? `${Math.max(1, Math.round(attachment.durationMs / 1000))} sec` : "Recording"}</small></span>
      </div>
      {url ? (
        <audio
          ref={audioRef}
          controls
          preload="metadata"
          src={url}
          onTimeUpdate={(event) => {
            const startedAt = attachment.startedAt;
            onTimeChange?.(startedAt ? startedAt + event.currentTarget.currentTime * 1000 : null);
          }}
          onPause={() => onTimeChange?.(null)}
          onEnded={() => onTimeChange?.(null)}
        />
      ) : <span className="muted small">Recording data is stored on this device.</span>}
    </div>
  );
}
