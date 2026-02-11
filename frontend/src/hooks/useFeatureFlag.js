import { useContext } from "react";
import { FeatureFlagContext } from "../contexts/FeatureFlagContext";

export function useFeatureFlag(name) {
  const { flags } = useContext(FeatureFlagContext);
  return flags?.[name] !== false;
}
