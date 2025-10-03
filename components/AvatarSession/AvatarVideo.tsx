import React, { forwardRef, useState } from "react";
import { ConnectionQuality } from "@heygen/streaming-avatar";

import { useConnectionQuality } from "../logic/useConnectionQuality";
import { useStreamingAvatarSession } from "../logic/useStreamingAvatarSession";
import { StreamingAvatarSessionState } from "../logic";
import { CloseIcon,CloseChatIcon } from "../Icons";
import { Button } from "../Button";
//import { useMessageHistory } from "../logic";

export const AvatarVideo = forwardRef<HTMLVideoElement>(({}, ref) => {
  const { sessionState, stopAvatar } = useStreamingAvatarSession();
  const { connectionQuality } = useConnectionQuality();
  // const { messages } = useMessageHistory();

  // const [showPopup, setShowPopup] = useState(false);
  // const [isSaving, setIsSaving] = useState(false);

  // // form state
  // const [name, setName] = useState("");
  // const [email, setEmail] = useState("");
  // const [contact, setContact] = useState("");

  const isLoaded = sessionState === StreamingAvatarSessionState.CONNECTED;

  // const handleStopClick = () => {
  //   setShowPopup(true); 
  // };

  // const handleSaveYes = async () => {
  //   if (!name || !email || !contact) {
  //     alert("All fields are required (Name, Email, Contact).");
  //     return;
  //   }

  //   try {
  //     setIsSaving(true);
  //     const conversation = messages;
  //     const res = await fetch("/api/zapier", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         messages: conversation,
  //         user: { name, email, contact },
  //       }),
  //     });
  //     if (!res.ok) throw new Error("Failed to save");
  //     const data = await res.json();
  //     console.log("Conversation saved!", data);
  //     alert("Conversation saved successfully!");
  //     stopAvatar();
  //     setShowPopup(false);
  //   } catch (error) {
  //     console.error("Error saving conversation:", error);
  //     alert("Failed to save conversation. Please try again.");
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  // const handleSaveNo = () => {
  //   stopAvatar(); 
  //   setShowPopup(false);
  // };

  return (
    <>
      {/* {connectionQuality !== ConnectionQuality.UNKNOWN && (
        <div className="absolute top-3 left-3 bg-black text-white rounded-lg px-3 py-2">
          Connection Quality: {connectionQuality}
        </div>
      )} */}
      {isLoaded && (
        <button
          className="absolute bottom-6 left-1/2 -translate-x-1/2 !p-2  z-10"
          //onClick={handleStopClick}
          onClick={stopAvatar}
        >
          <CloseIcon />
        </button>
      )}

      {/* {showPopup && (
        <div className="fixed inset-0 bg-zinc-900 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-[360px] text-center">
            <h2 className="text-lg font-semibold mb-4 text-zinc-700">
              Would you like to save the conversation?
            </h2>

            
            <input
              type="text"
              placeholder="Name"
              className="w-full border rounded-lg px-3 py-2 mb-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full border rounded-lg px-3 py-2 mb-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSaving}
            />
            <input
              type="text"
              placeholder="Contact Number"
              className="w-full border rounded-lg px-3 py-2 mb-4"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={isSaving}
            />

            <div className="flex justify-between gap-3">
              <Button
                className="flex-1 bg-[#E63922] text-white rounded-lg py-2 hover:bg-red-700"
                onClick={handleSaveYes}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                className="flex-1 bg-gray-400 text-white rounded-lg py-2 hover:bg-gray-500"
                onClick={handleSaveNo}
                disabled={isSaving}
              >
                No
              </Button>
            </div>

            <button
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
              onClick={() => setShowPopup(false)}
              disabled={isSaving}
            >
              Close
            </button>
          </div>
        </div>
      )} */}

      <video
        ref={ref}
        autoPlay
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      >
        <track kind="captions" />
      </video>
    </>
  );
});
AvatarVideo.displayName = "AvatarVideo";
