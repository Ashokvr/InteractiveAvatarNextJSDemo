import { ToggleGroup, ToggleGroupItem } from "@radix-ui/react-toggle-group";
import React, { useState } from "react";
import { useVoiceChat } from "../logic/useVoiceChat";
import { Button } from "../Button";
import { useInterrupt } from "../logic/useInterrupt";

import { AudioInput } from "./AudioInput";
// import { TextInput } from "./TextInput";

export const AvatarControls: React.FC = () => {
  const {
    isVoiceChatLoading,
    isVoiceChatActive,
    startVoiceChat,
    stopVoiceChat,
  } = useVoiceChat();
  const { interrupt } = useInterrupt();

  // toggle for showing/hiding interrupt (if you still need it)
  const [showButton, setShowButton] = useState(false);

  return (
    <div className="flex flex-col gap-3 relative w-full items-center">
      {/* Raised toggle group */}
      {/* <div className="mt-[-20px] flex justify-center">
        <ToggleGroup
          className={`bg-zinc-700 rounded-lg p-1 ${
            isVoiceChatLoading ? "opacity-50" : ""
          }`}
          disabled={isVoiceChatLoading}
          type="single"
          value={isVoiceChatActive || isVoiceChatLoading ? "voice" : "text"}
          onValueChange={(value) => {
            if (value === "voice" && !isVoiceChatActive && !isVoiceChatLoading) {
              startVoiceChat();
            } else if (
              value === "text" &&
              isVoiceChatActive &&
              !isVoiceChatLoading
            ) {
              stopVoiceChat();
            }
          }}
        >
          <ToggleGroupItem
            className="data-[state=on]:bg-zinc-800 rounded-lg p-2 text-sm w-[90px] text-center"
            value="voice"
          >
            Voice Chat
          </ToggleGroupItem>
          <ToggleGroupItem
            className="data-[state=on]:bg-zinc-800 rounded-lg p-2 text-sm w-[90px] text-center"
            value="text"
          >
            Text Chat
          </ToggleGroupItem>
        </ToggleGroup>
      </div> */}

      {/* Controls row: mic on the right */}
      <div className="flex w-full justify-end items-center px-4 mb-6">
        <AudioInput />
      </div>


      {/* Interrupt button if shown */}
      {showButton && (
        <div className="absolute top-[-70px] right-3">
          <Button className="!bg-zinc-700 !text-white" onClick={interrupt}>
            Interrupt
          </Button>
        </div>
      )}
    </div>    
  );
};
