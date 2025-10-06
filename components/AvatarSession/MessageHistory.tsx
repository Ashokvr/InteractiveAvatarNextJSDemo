/* eslint-disable prettier/prettier */
import React, { useEffect, useRef } from "react";
import { useMessageHistory, MessageSender } from "../logic";
import { knowledgeBases } from "@/app/lib/constants";
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

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isNearBottom) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const getAvatarName = (avatarName: string) => {
    const avatar = knowledgeBases.find((a) => a.id === avatarName);
    return avatar ? avatar.avatarname : "Assistant";
  };

  const sanitizeMessage = (text: string) => {
    // Allow letters (all unicode), numbers, spaces, and newlines
    const cleaned = text.replace(
      /[^\u0000-\u007F\u0400-\u04FF\u0900-\u097F\u4E00-\u9FFF\u0600-\u06FF\u3040-\u30FF\uAC00-\uD7AF\u0100-\u017F0-9a-zA-Z\s\n]/g,
      ""
    );
    return cleaned.split("\n").map((line, i) => (
      <p key={i} className="text-sm break-words">
        {line}
      </p>
    ));
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-2 px-4 sm:px-6 md:px-8 py-2 
                 text-white self-center w-full 
                 max-h-screen h-[90vh] overflow-y-auto rounded-lg"
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
              ? getAvatarName(config.knowledgeId || "")
              : "You"}
          </p>
          {sanitizeMessage(message.content)}
        </div>
      ))}
    </div>
  );
};
