import React, { useMemo, useState } from "react";
import {
  StartAvatarRequest,
} from "@heygen/streaming-avatar";

import { Input } from "../Input";
import { Select } from "../Select";

import { Field } from "./Field";

import { AVATARS, STT_LANGUAGE_LIST, knowledgeBases } from "@/app/lib/constants";

interface AvatarConfigProps {
  onConfigChange: (config: StartAvatarRequest) => void;
  config: StartAvatarRequest;
}

export const AvatarConfig: React.FC<AvatarConfigProps> = ({
  onConfigChange,
  config,
}) => {
  const onChange = <T extends keyof StartAvatarRequest>(
    key: T,
    value: StartAvatarRequest[T],
  ) => {
    onConfigChange({ ...config, [key]: value });
  };

  const selectedKnowledge = useMemo(() => {
    return knowledgeBases.find((kb) => kb.id === config.knowledgeId);
  }, [config.knowledgeId]);

  return (
    <div className="relative flex flex-col gap-4 w-[550px] py-8 max-h-full overflow-y-auto px-4">
      <Field label="Assistant Role">
        <Select
          isSelected={(option) =>
            typeof option !== "string" && option.id === selectedKnowledge?.id
          }
          options={knowledgeBases}
          placeholder="Select Knowledge Base"
          renderOption={(option) =>
            typeof option === "string" ? option : option.name
          }
          value={selectedKnowledge ? selectedKnowledge.name : ""}
          onSelect={(option) => {
            if (typeof option !== "string") {
              onChange("knowledgeId", option.id);
            }
          }}
        />
      </Field>
    </div>
  );
};
