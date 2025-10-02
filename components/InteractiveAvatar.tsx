import {
  AvatarQuality,
  StreamingEvents,
  VoiceChatTransport,
  VoiceEmotion,
  StartAvatarRequest,
  STTProvider,
  ElevenLabsModel,
} from "@heygen/streaming-avatar";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, useUnmount } from "ahooks";
import { Button } from "./Button";
import { AvatarConfig } from "./AvatarConfig";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { AvatarControls } from "./AvatarSession/AvatarControls";
import { useVoiceChat } from "./logic/useVoiceChat";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from "./logic";
import { LoadingIcon } from "./Icons";
import { MessageHistory } from "./AvatarSession/MessageHistory";
import Logo from "@/components/Logo";
import { AVATARS } from "@/app/lib/constants";
import { TextInput } from "./AvatarSession/TextInput";
const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.High,
  avatarName: AVATARS[0].avatar_id,
  knowledgeId: "7135d45468ea4ba195356c92cae0d8fb",
  voice: {
    // voiceId: "5405e45af6674ed09485e17cd624a95f",
    rate: 1.0,
    emotion: VoiceEmotion.FRIENDLY,
    model: ElevenLabsModel.eleven_multilingual_v2,
  },
  language: "en",
  voiceChatTransport: VoiceChatTransport.WEBSOCKET,
  sttSettings: {
    provider: STTProvider.DEEPGRAM,
  },
};

function InteractiveAvatar() {
  const { initAvatar, startAvatar, stopAvatar, sessionState, stream,isAvatarTalking } =
    useStreamingAvatarSession();
  const { startVoiceChat } = useVoiceChat();

  const [config, setConfig] = useState<StartAvatarRequest>(DEFAULT_CONFIG);
  const [showChat, setShowChat] = useState(false);

  const mediaStream = useRef<HTMLVideoElement>(null);

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();

      //console.log("Access Token:", token); // Log the token to verify

      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      throw error;
    }
  }

  const startSessionV2 = useMemoizedFn(async (isVoiceChat: boolean) => {
    try {
      const newToken = await fetchAccessToken();
      const avatar = initAvatar(newToken);

      avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        //console.log("Avatar started talking", e);
      });
      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        //console.log("Avatar stopped talking", e);
      });
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        //console.log("Stream disconnected");
      });
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        //console.log(">>>>> Stream ready:", event.detail);
      });
      avatar.on(StreamingEvents.USER_START, (event) => {
        //console.log(">>>>> User started talking:", event);
      });
      avatar.on(StreamingEvents.USER_STOP, (event) => {
        //console.log(">>>>> User stopped talking:", event);
      });
      avatar.on(StreamingEvents.USER_END_MESSAGE, (event) => {
        //console.log(">>>>> User end message:", event);
      });
      avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
        //console.log(">>>>> User talking message:", event);
      });
      avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
        //console.log(">>>>> Avatar talking message:", event);
      });
      avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
        //console.log(">>>>> Avatar end message:", event);
      });

      await startAvatar(config);
      await startVoiceChat();
      
    } catch (error) {
      console.error("Error starting avatar session:", error);
    }
  });

  useUnmount(() => {
    stopAvatar();
  });

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
      };
    }
  }, [mediaStream, stream]);


  return (
    <div className="w-full h-full flex">
      {sessionState === StreamingAvatarSessionState.INACTIVE ? (
          
          // Inactive screen (centered setup)
          <div className="flex w-full h-screen">
          {/* Left side: Cover image + logo */}
              <div className="hidden md:flex w-1/2 flex-col items-center justify-center bg-[url('https://storage.googleapis.com/q1-qms-advisor.appspot.com/login-cover-new.png')] bg-cover bg-center">
                <div className="mb-6">
                  <Logo />
                </div>
                <h2 className="text-3xl text-gray-900 text-center">
                  Your Compliance <br /> Assistant
                </h2>
              </div>
            
              {/* Right side: Config + button */}
              <div className="flex w-full md:w-1/2 items-center justify-center">
                <div className="flex flex-col items-center gap-6  bg-zinc-900 p-8">
                  <AvatarConfig config={config} onConfigChange={setConfig} />
                  <Button
                    className="bg-[#E63922]"
                    onClick={() => startSessionV2(true)}
                  >
                    Video Chat
                  </Button>
                </div>
              </div>
            </div>
      
      ) : (
        // Active / Connecting screen
        <div className="w-full flex flex-row">
          {/* Left side: Avatar/Voice area */}
          <div className="flex flex-1 relative bg-zinc-900 overflow-hidden">
            <AvatarVideo ref={mediaStream} />
            {sessionState === StreamingAvatarSessionState.CONNECTED ? (
              <div className="absolute bottom-4 flex justify-center w-full">
                <AvatarControls />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingIcon />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowChat((v) => !v)}
            aria-pressed={showChat}
            title={showChat ? "Hide chat" : "Show chat"}
            className="absolute top-3 right-3 !p-2 bg-opacity-50 z-10"
          >
            {/* SVG: eye when hidden, eye-off when visible */}
            {showChat ? (
              // Eye-off
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M4.25 8C4.25 5.23857 6.48858 3 9.25 3H17C19.7614 3 22 5.23858 22 8V16C22 18.7614 19.7614 21 17 21H3C2.63251 21 2.29462 20.7984 2.12004 20.475C1.94546 20.1517 1.96232 19.7586 2.16395 19.4513L3.75815 17.0221C4.07904 16.5331 4.25 15.961 4.25 15.3761V8ZM9.25 5C7.59315 5 6.25 6.34314 6.25 8V15.3761C6.25 16.3509 5.96506 17.3044 5.43024 18.1194L4.85236 19H17C18.6569 19 20 17.6569 20 16V8C20 6.34315 18.6569 5 17 5H9.25ZM10.5251 9.52513C10.9157 9.1346 11.5488 9.1346 11.9393 9.52513L13 10.5858L14.0607 9.52513C14.4512 9.1346 15.0844 9.1346 15.4749 9.52513C15.8654 9.91565 15.8654 10.5488 15.4749 10.9393L14.4142 12L15.4749 13.0607C15.8654 13.4512 15.8654 14.0843 15.4749 14.4749C15.0844 14.8654 14.4512 14.8654 14.0607 14.4749L13 13.4142L11.9393 14.4749C11.5488 14.8654 10.9157 14.8654 10.5251 14.4749C10.1346 14.0843 10.1346 13.4512 10.5251 13.0607L11.5858 12L10.5251 10.9393C10.1346 10.5488 10.1346 9.91565 10.5251 9.52513Z" fill="#D9D9D9"/>
              </svg>
             
            ) : (
              // Eye
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M4.25 8C4.25 5.23857 6.48858 3 9.25 3H17C19.7614 3 22 5.23858 22 8V16C22 18.7614 19.7614 21 17 21H3C2.63251 21 2.29462 20.7984 2.12004 20.475C1.94546 20.1517 1.96232 19.7586 2.16395 19.4513L3.75815 17.0221C4.07904 16.5331 4.25 15.961 4.25 15.3761V8ZM9.25 5C7.59315 5 6.25 6.34314 6.25 8V15.3761C6.25 16.3509 5.96506 17.3044 5.43024 18.1194L4.85236 19H17C18.6569 19 20 17.6569 20 16V8C20 6.34315 18.6569 5 17 5H9.25ZM16.2071 9.79289C16.5976 10.1834 16.5976 10.8166 16.2071 11.2071L13.2071 14.2071C12.8166 14.5976 12.1834 14.5976 11.7929 14.2071L10.2929 12.7071C9.90237 12.3166 9.90237 11.6834 10.2929 11.2929C10.6834 10.9024 11.3166 10.9024 11.7071 11.2929L12.5 12.0858L14.7929 9.79289C15.1834 9.40237 15.8166 9.40237 16.2071 9.79289Z" fill="#E63922"/>
              </svg>

            )}
          </button>

          {/* Right side: Messages */}
          {sessionState === StreamingAvatarSessionState.CONNECTED && showChat && (
            <div className="w-1/3 flex flex-col  bg-zinc-800 p-4 overflow-y-auto">
              {/* Message history (scrollable) */}
              <div className="flex-1 overflow-y-auto p-4">
                <MessageHistory config={config} />
              </div>

              {/* Text input fixed at the bottom of chat */}
              <div className="border-t border-zinc-700 p-2">
              {!isAvatarTalking && <TextInput />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>

  );  
}

export default function InteractiveAvatarWrapper() {
  return (
    <StreamingAvatarProvider basePath={process.env.NEXT_PUBLIC_BASE_API_URL}>
      <InteractiveAvatar />
    </StreamingAvatarProvider>
  );
}
