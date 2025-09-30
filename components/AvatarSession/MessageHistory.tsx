import React, { useEffect, useRef } from "react";
import { useMessageHistory, MessageSender } from "../logic";
import { AVATARS,knowledgeBases } from "@/app/lib/constants";
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

    // check if user is within ~100px of bottom
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
          <p className="text-sm break-words">{message.content}</p>
        </div>
      ))}
    </div>
  );
};
