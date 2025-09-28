import React, { useEffect, useRef } from "react";
import { useMessageHistory, MessageSender } from "../logic";
import { AVATARS } from "@/app/lib/constants";
import { StartAvatarRequest } from "@heygen/streaming-avatar";

interface MessageHistoryProps {
  config: StartAvatarRequest;
}

export const MessageHistory: React.FC<MessageHistoryProps> = ({ config }) => {
  const { messages } = useMessageHistory();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || messages.length === 0) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const getAvatarName = (avatarName: string) => {
    const avatar = AVATARS.find((a) => a.avatar_id === avatarName);
    return avatar ? avatar.name : "Assistant";
  };

  return (
    <div
      ref={containerRef}
      className="w-full sm:w-[400px] md:w-[500px] lg:w-[600px] max-w-full overflow-y-auto flex flex-col gap-2 px-4 sm:px-6 md:px-8 py-2 text-white self-center"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex flex-col gap-1 max-w-[350px] ${
            message.sender === MessageSender.CLIENT
              ? "self-end items-end"
              : "self-start items-start"
          }`}
        >
          <p className="text-xs text-zinc-400">
            {message.sender === MessageSender.AVATAR
              ? getAvatarName(config.avatarName)
              : "You"}
          </p>
          <p className="text-sm">{message.content}</p>
        </div>
      ))}
    </div>
  );
};
