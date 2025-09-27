import { ToggleGroup, ToggleGroupItem } from "@radix-ui/react-toggle-group";
import React from "react";

import { useVoiceChat } from "../logic/useVoiceChat";
import { Button } from "../Button";
import { useInterrupt } from "../logic/useInterrupt";

import { AudioInput } from "./AudioInput";
import { TextInput } from "./TextInput";

export const AvatarControls: React.FC = () => {
  const {
    isVoiceChatLoading,
    isVoiceChatActive,
    startVoiceChat,
    stopVoiceChat,
  } = useVoiceChat();
  const { interrupt } = useInterrupt();

  return (
    <div className="flex flex-col gap-3 relative w-full items-center">
      <div className="absolute top-[-70px] right-3">
          <AudioInput /> 
      </div>
    </div>
  );
};
