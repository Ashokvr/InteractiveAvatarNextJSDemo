"use client";

import InteractiveAvatar from "@/components/InteractiveAvatar";

export default function App() {
  return (
    <div className="w-screen h-screen flex flex-col">
      {/* Full screen container */}
      <div className="flex-1 flex flex-col">
        <InteractiveAvatar />
      </div>
    </div>
  );
}
