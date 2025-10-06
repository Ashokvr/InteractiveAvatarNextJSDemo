/* eslint-disable prettier/prettier */
import { create } from "zustand";

interface KnowledgeState {
  // Knowledge info
  knowledgeId: string | null;
  name: string;
  opening?: string | null;
  prompt?: string | null;
  // User info
  userName: string;
  userEmail: string;
  userCompany: string;
  userContact: string;

  // Actions
  setKnowledge: (data: Partial<KnowledgeState>) => void;
  reset: () => void;
}

export const useKnowledgeState = create<KnowledgeState>((set: (partialState: Partial<KnowledgeState> | ((state: KnowledgeState) => Partial<KnowledgeState>)) => void) => ({
  knowledgeId: null,
  name: "",
  opening: "",
  prompt: "",
  userName: "",
  userEmail: "",
  userCompany: "",
  userContact: "",

  setKnowledge: (data: Partial<KnowledgeState>) => set((state) => ({ ...state, ...data })),

  reset: () =>
    set({
      knowledgeId: null,
      name: "",
      opening: "",
      prompt: "",
      userName: "",
      userEmail: "",
      userCompany: "",
      userContact: "",
    }),
}));
