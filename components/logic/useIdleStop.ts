// ./logic/useIdleStop.ts
import { useEffect, useRef } from "react";
import { useConversationState } from "./useConversationState";
import { useVoiceChat } from "./useVoiceChat";
import { useStreamingAvatarSession } from "./useStreamingAvatarSession";
import { StreamingAvatarSessionState } from "./context";
export function useIdleStop() {
  const { isUserTalking } = useConversationState();
  const { isMuted } = useVoiceChat();
  const { stopAvatar, sessionState } = useStreamingAvatarSession();
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  function resetTimer() {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (sessionState !== StreamingAvatarSessionState.INACTIVE) {
        console.log("⏹ Idle timeout reached → stopping avatar");
        stopAvatar(); // cleanup + stop session
      }
    }, 300_000); // 5 minutes
  }

  useEffect(() => {
    resetTimer();
  }, [isUserTalking, isMuted]);

  useEffect(() => {
    const listener = () => resetTimer();
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);
}
