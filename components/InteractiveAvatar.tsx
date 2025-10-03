/* eslint-disable import/order */
/* eslint-disable prettier/prettier */
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
import Logo from "@/components/Logo";
import { AvatarConfig } from "./AvatarConfig";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { AvatarControls } from "./AvatarSession/AvatarControls";
import { MessageHistory } from "./AvatarSession/MessageHistory";
import { TextInput as ChatTextInput } from "./AvatarSession/TextInput"; // your chat input
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { useVoiceChat } from "./logic/useVoiceChat";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from "./logic";
import { LoadingIcon } from "./Icons";
import { AVATARS } from "@/app/lib/constants";
import { useIdleStop } from "./logic/useIdleStop";

const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.High,
  avatarName: AVATARS[0].avatar_id,
  knowledgeId: "7135d45468ea4ba195356c92cae0d8fb",
  voice: {
    rate: 1.0,
    emotion: VoiceEmotion.FRIENDLY,
    model: ElevenLabsModel.eleven_multilingual_v2,
  },
  language: "en",
  voiceChatTransport: VoiceChatTransport.WEBSOCKET,
  sttSettings: { provider: STTProvider.DEEPGRAM },
};

// Simple helpers

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
// Strict E.164: +[country][number], 8–15 digits total after '+'
const e164Re = /^\+[1-9]\d{7,14}$/;

type FieldErrors = Partial<Record<"name" | "email" | "company" | "contactNo", string>>;

function validateCreateForm({ name, email, company, contactNo }: {
  name: string; email: string; company: string; contactNo: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!name.trim()) errors.name = "Name is required.";
  if (!email.trim()) errors.email = "Email is required.";
  else if (!emailRe.test(email)) errors.email = "Enter a valid email.";
  if (!company.trim()) errors.company = "Company is required.";
  if (!contactNo.trim()) errors.contactNo = "Contact number is required.";
  else if (!e164Re.test(contactNo)) errors.contactNo = "Use E.164 format (e.g., +15551234567).";

  return errors;
}

function InputRow(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  const { id, label, value, onChange, placeholder, type = "text", error } = props;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-zinc-200 mb-1" htmlFor={id}>
        {label}
      </label>
      <input
        className={`w-full rounded-xl bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-4 py-3 outline-none border ${
          error ? "border-red-500" : "border-zinc-700 focus:border-zinc-500"
        }`}
        id={id}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

function InteractiveAvatar() {
  const {
    initAvatar,
    startAvatar,
    stopAvatar,
    sessionState,
    stream,
    isAvatarTalking,
  } = useStreamingAvatarSession();
  useIdleStop();
  const { startVoiceChat } = useVoiceChat();
  const [config, setConfig] = useState<StartAvatarRequest>(DEFAULT_CONFIG);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"lookup" | "create">("lookup");
  // Lookup state
  const [lookupValue, setLookupValue] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  // Create form state
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [company, setCompany] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const mediaStream = useRef<HTMLVideoElement>(null);

  async function fetchAccessToken() {
    const response = await fetch("/api/get-access-token", { method: "POST" });
    const token = await response.text();

    return token;
  }
  async function assignOrCreateKnowledgeId() {
    const res = await fetch("/api/knowledge/assign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: userName,
        email: userEmail,
        company,
        contactNo,
        opening: "So, you are interested in getting an ISO-9001 quality management system developed. \nI'll be happy to help. For that, I'd need some info about your company. Do you mind answering a few questions?",
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();

    return json.knowledgeId as string;
  }

  async function startWithKnowledgeId(knowledgeId: string) {
    const token = await fetchAccessToken();
    const avatar = initAvatar(token);
    const cfg: StartAvatarRequest = { ...config, knowledgeId };

    await startAvatar(cfg);
    await startVoiceChat();
  }

  // ===== Actions =====
  const onLookup = useMemoizedFn(async () => {
    if (!lookupValue.trim()) {
      setLookupError("Enter email or phone number.");

      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/knowledge/assign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: lookupValue.includes("@") ? lookupValue : undefined,
          contactNo: !lookupValue.includes("@") ? lookupValue : undefined,
          onlyFind: true,
        }),
      });
      const { found, knowledgeId } = await res.json();

      if (found && knowledgeId) {
        await startWithKnowledgeId(knowledgeId);
      } else {
        if (lookupValue.includes("@")) setUserEmail(lookupValue);
        else setContactNo(lookupValue);
        setStep("create");
      }
    } catch (e: any) {
      setLookupError(e?.message || "Lookup failed.");
    } finally {
      setLoading(false);
    }
  });

  const startSessionV2 = useMemoizedFn(async () => {
    const v = validateCreateForm({
      name: userName,
      email: userEmail,
      company,
      contactNo,
    });
  
    setErrors(v);
    if (Object.keys(v).length > 0) return;
  
    setLoading(true);
    try {
      // 1. Create or assign KB
      const knowledgeId = await assignOrCreateKnowledgeId();
  
      // 2. Start avatar with it
      await startWithKnowledgeId(knowledgeId);
    } catch (error) {
      console.error("Error starting avatar session:", error);
    } finally {
      setLoading(false);
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

  const createDisabled =
    loading ||
    Object.keys(
      validateCreateForm({ name: userName, email: userEmail, company, contactNo })
    ).length > 0;

  return (
      <div className="w-full h-full flex">
        {sessionState === StreamingAvatarSessionState.INACTIVE ? (
          <div className="flex w-full h-screen">
            {/* Left */}
            <div className="hidden md:flex w-1/2 flex-col items-center justify-center bg-[url('https://storage.googleapis.com/q1-qms-advisor.appspot.com/login-cover-new.png')] bg-cover bg-center">
              <div className="mb-6"><Logo /></div>
              <h2 className="text-3xl text-gray-900 text-center">Your Compliance <br /> Assistant</h2>
            </div>
  
            {/* Right */}
            <div className="flex w-full md:w-1/2 items-center justify-center">
              <div className="flex flex-col gap-6 bg-zinc-900 p-8 rounded-2xl shadow-lg w-full max-w-lg">
                <div className="flex flex-col gap-4">
                  <AvatarConfig config={config} onConfigChange={setConfig} />
                </div>

                {config.knowledgeId === "7135d45468ea4ba195356c92cae0d8fb" ? (
                  // Special KB → lookup/create flow
                  step === "lookup" ? (
                    <>
                      <InputRow
                        id="lookupValue"
                        label="Email or Contact No"
                        placeholder="jane@acme.com or 555-123-4567"
                        value={lookupValue}
                        onChange={setLookupValue}
                      />
                      {lookupError && <p className="text-sm text-red-400">{lookupError}</p>}
                      <Button
                        className={`bg-[#E63922] ${loading ? "opacity-50" : ""}`}
                        disabled={loading}
                        onClick={onLookup}
                      >
                        {loading ? "Checking..." : "Video Chat"}
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* CREATE form */}
                      <div className="grid grid-cols-1 gap-4">
                        <InputRow
                          error={errors.name}
                          id="name"
                          label="Full Name"
                          placeholder="Jane Doe"
                          value={userName}
                          onChange={setUserName}
                        />
                        <InputRow
                          error={errors.email}
                          id="email"
                          label="Email"
                          placeholder="jane@acme.com"
                          type="email"
                          value={userEmail}
                          onChange={setUserEmail}
                        />
                        <InputRow
                          error={errors.company}
                          id="company"
                          label="Company"
                          placeholder="Acme Corp"
                          value={company}
                          onChange={setCompany}
                        />
                        <InputRow
                          error={errors.contactNo}
                          id="contactNo"
                          label="Contact No(+1)"
                          placeholder="+15551234567"
                          value={contactNo}
                          onChange={setContactNo}
                        />
                      </div>

                      <Button
                        className={`bg-[#E63922] ${createDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={createDisabled}
                        onClick={startSessionV2}
                      >
                        {loading ? "Starting..." : "Video Chat"}
                      </Button>

                      <button
                        className="text-xs text-zinc-400 underline self-start"
                        type="button"
                        onClick={() => setStep("lookup")}
                      >
                        Back to lookup
                      </button>
                    </>
                  )
                ) : (
                  // All other KBs → simple Video Chat button
                  <Button
                    className={`bg-[#E63922] ${loading ? "opacity-50" : ""}`}
                    disabled={loading}
                    onClick={() => startWithKnowledgeId(config.knowledgeId!)}
                  >
                    {loading ? "Starting..." : "Video Chat"}
                  </Button>
                )}
              </div>
            </div>

          </div>
        ) : (
          // Active screen (unchanged)
          <div className="w-full flex flex-row">
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
              aria-pressed={showChat}
              className="absolute top-3 right-3 !p-2 bg-opacity-50 z-10"
              title={showChat ? "Hide chat" : "Show chat"}
              type="button"
              onClick={() => setShowChat((v) => !v)}
            >
              {/* SVG: eye when hidden, eye-off when visible */}
              {showChat ? (
                // Eye-off
                <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M4.25 8C4.25 5.23857 6.48858 3 9.25 3H17C19.7614 3 22 5.23858 22 8V16C22 18.7614 19.7614 21 17 21H3C2.63251 21 2.29462 20.7984 2.12004 20.475C1.94546 20.1517 1.96232 19.7586 2.16395 19.4513L3.75815 17.0221C4.07904 16.5331 4.25 15.961 4.25 15.3761V8ZM9.25 5C7.59315 5 6.25 6.34314 6.25 8V15.3761C6.25 16.3509 5.96506 17.3044 5.43024 18.1194L4.85236 19H17C18.6569 19 20 17.6569 20 16V8C20 6.34315 18.6569 5 17 5H9.25ZM10.5251 9.52513C10.9157 9.1346 11.5488 9.1346 11.9393 9.52513L13 10.5858L14.0607 9.52513C14.4512 9.1346 15.0844 9.1346 15.4749 9.52513C15.8654 9.91565 15.8654 10.5488 15.4749 10.9393L14.4142 12L15.4749 13.0607C15.8654 13.4512 15.8654 14.0843 15.4749 14.4749C15.0844 14.8654 14.4512 14.8654 14.0607 14.4749L13 13.4142L11.9393 14.4749C11.5488 14.8654 10.9157 14.8654 10.5251 14.4749C10.1346 14.0843 10.1346 13.4512 10.5251 13.0607L11.5858 12L10.5251 10.9393C10.1346 10.5488 10.1346 9.91565 10.5251 9.52513Z" fill="#D9D9D9" fillRule="evenodd"/>
                </svg>
              
              ) : (
                // Eye
                <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M4.25 8C4.25 5.23857 6.48858 3 9.25 3H17C19.7614 3 22 5.23858 22 8V16C22 18.7614 19.7614 21 17 21H3C2.63251 21 2.29462 20.7984 2.12004 20.475C1.94546 20.1517 1.96232 19.7586 2.16395 19.4513L3.75815 17.0221C4.07904 16.5331 4.25 15.961 4.25 15.3761V8ZM9.25 5C7.59315 5 6.25 6.34314 6.25 8V15.3761C6.25 16.3509 5.96506 17.3044 5.43024 18.1194L4.85236 19H17C18.6569 19 20 17.6569 20 16V8C20 6.34315 18.6569 5 17 5H9.25ZM16.2071 9.79289C16.5976 10.1834 16.5976 10.8166 16.2071 11.2071L13.2071 14.2071C12.8166 14.5976 12.1834 14.5976 11.7929 14.2071L10.2929 12.7071C9.90237 12.3166 9.90237 11.6834 10.2929 11.2929C10.6834 10.9024 11.3166 10.9024 11.7071 11.2929L12.5 12.0858L14.7929 9.79289C15.1834 9.40237 15.8166 9.40237 16.2071 9.79289Z" fill="#E63922" fillRule="evenodd"/>
                </svg>

              )}
            </button>

  
            {/* eye/eye-off button … */}
  
            {sessionState === StreamingAvatarSessionState.CONNECTED && (
              <div className="w-1/3 flex flex-col bg-zinc-800 p-4 overflow-y-auto">
                <div className="overflow-y-auto p-4 max-h-[90vh]">
                  <MessageHistory config={config} />
                </div>
                <div className="border-t border-zinc-700 p-2">
                  {!isAvatarTalking && <ChatTextInput />}
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
