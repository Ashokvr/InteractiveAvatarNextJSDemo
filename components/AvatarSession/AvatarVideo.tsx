/* eslint-disable prettier/prettier */
import React, { forwardRef, useState } from "react";
import { ConnectionQuality } from "@heygen/streaming-avatar";

import { useConnectionQuality } from "../logic/useConnectionQuality";
import { useStreamingAvatarSession } from "../logic/useStreamingAvatarSession";
import { StreamingAvatarSessionState } from "../logic";
import { CloseIcon,CloseChatIcon } from "../Icons";
import { Button } from "../Button";
import { useMessageHistory } from "../logic";
import { useKnowledgeState } from "../logic/knowledgeState";

export const AvatarVideo = forwardRef<HTMLVideoElement>(({}, ref) => {
  const { sessionState, stopAvatar } = useStreamingAvatarSession();
  const { connectionQuality } = useConnectionQuality();
  const { messages } = useMessageHistory();
  const { knowledgeId, name, userCompany,userEmail,userContact } = useKnowledgeState();


  const [showPopup, setShowPopup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editableQA, setEditableQA] = useState<{ question: string; answer: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);


  // // form state

  const isLoaded = sessionState === StreamingAvatarSessionState.CONNECTED;

  const handleStopClick = async () => {
    try {
      setIsProcessing(true);
      //console.log("Parsing conversation for Q&A extraction...",messages);
      const parseRes = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
  
      if (!parseRes.ok) throw new Error("Failed to parse conversation");
  
      const { qa } = await parseRes.json();
  
      if (Array.isArray(qa) && qa.length > 0) {
        setEditableQA(qa);
        setShowPopup(true);
      } else {
        stopAvatar();
      }
      
    } catch (err) {
      //console.error(err);
      alert("Something went wrong while processing. Please retry the session again.");
    } finally {
      setIsProcessing(false);
    }
  };
  const handleAnswerChange = (index: number, newAnswer: string) => {
    const updated = [...editableQA];
    updated[index].answer = newAnswer;
    setEditableQA(updated);
  };

  const handleSaveYes = async () => {
    try {
      setIsSaving(true);
      // Build dynamic prompt from edited answers
      const dynamicPrompt = editableQA
        .map((item, i) => `${i + 1}. ${item.question}\nAnswer: ${item.answer}`)
        .join("\n\n");

      const body = {
        knowledgeId: knowledgeId,
        name: `${userCompany || "Company"}-${name || "User"}-${userEmail || "email"}-${userContact || "contact"}`,
        opening: "Here’s your updated knowledge base with fresh Q&A context.",
        prompt: `You are a guardrailed voice assistant.
                    Your exclusive topic is: "ISO-9001 Quality Management System Development."

                    Your primary task:
                    Collect all answers for the required fields below in the exact order.
                    Do not start with greetings or general questions.
                    Immediately begin reviewing which questions are answered and which remain.
                    Always reply in the user's language (e.g., if the user speaks Russian, respond in Russian).

                    Context:
                    User details:
                    - Name: ${name}
                    - Company: ${userCompany}
                    - Email: ${userEmail}
                    - Contact No: ${userContact}

                    Collected answers so far:
                    ${dynamicPrompt}

                    Instructions:
                    - Use the above answers as your session memory.
                    - Identify unanswered or “skipped” questions and ask them next.
                    - Confirm existing answers briefly if necessary (e.g., “You mentioned 60 employees, is that still correct?”).
                    - If an answer needs updating, overwrite the old one.
                    - Always stay on ISO-9001 Quality Management System Development topic.
                    - Keep responses concise, friendly, and professional.
                    - When all questions are answered, say: “I have collected all the information.”

                    Now, based on the answers provided, continue asking the remaining unanswered questions.

                    Required fields:
                    1. Can you verify the name of your company is ${userCompany}?
                    2. What does your company do?
                    3. How many employees do you have?
                    4. Can you tell me who’s on your team and how roles are divided?
                    5. What products and services do you provide? Please provide a list.
                    6. Are there any industry standards, regulations, or customer specifications your products or services must follow?
                    7. Do you want to certify all of your products and services?
                    8. Are all processes performed in-house, or are some outsourced?
                    9. What production capabilities do you have (processes, equipment, etc.)? Please provide a list.
                    10. How many locations/sites do you have?
                    11. Should the management system cover all locations?
                    12. Who will be responsible for the implementation and control of the Quality Management System (QMS)?
                    13. What software do you use for processes such as sales, production, and purchasing?
                    14. Are your products exported?
                    `,
      };

      const res = await fetch("/api/knowledge/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to update knowledge base");
      const data = await res.json();
      //console.log("Update success:", data);
      alert("Knowledge base updated successfully!");
      stopAvatar();
    } catch (err) {
      //console.error(err);
      alert("Error updating profile");
    } finally {
      setIsSaving(false);
      setShowPopup(false);
    }
  };

  const handleSaveNo = () => {
    stopAvatar(); 
    setShowPopup(false);
  };

  const handleDelete = async () => {
    
    try {
      setIsDeleting(true);
      const res = await fetch("/api/knowledge/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledgeId: knowledgeId }),
      });

      if (!res.ok) throw new Error("Failed to delete knowledge base");
      const data = await res.json();
      //console.log("Delete success:", data);
      alert("Knowledge base deleted successfully!");
    } catch (err) {
      //console.error(err);
      alert("Error deleting profile");
    } finally {
      setIsDeleting(false);
      stopAvatar();
      setShowPopup(false);
    }
  };

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
          onClick={handleStopClick}
        >
          <CloseIcon />
        </button>
      )}

      {showPopup && (
        <div className="fixed inset-0 bg-zinc-900 bg-opacity-80 flex items-center justify-center z-50 overflow-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto text-left">
            <h2 className="text-lg font-semibold mb-4 text-zinc-700 text-center">
              Review & Edit Q&A
            </h2>

            {editableQA.map((item, index) => (
              <div key={index} className="mb-4 border-b border-gray-200 pb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {index + 1}. {item.question}
                </p>
                <textarea
                  className="w-full border rounded-lg p-2 text-sm text-gray-800"
                  rows={2}
                  value={item.answer}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                />
              </div>
            ))}

            <div className="flex justify-between gap-3 mt-4">
              <Button
                className="flex-1 bg-[#E63922] text-white rounded-lg py-2 hover:bg-red-700"
                disabled={isSaving}
                onClick={handleSaveYes}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                className="flex-1 bg-gray-400 text-white rounded-lg py-2 hover:bg-gray-500"
                disabled={isSaving}
                onClick={handleSaveNo}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gray-400 text-white rounded-lg py-2 hover:bg-gray-500"
                onClick={handleDelete}
              >
                {isDeleting ? "Deleting..." : "Delete Profile"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white z-50">
          <p>Processing conversation… please wait</p>
        </div>
      )}

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
