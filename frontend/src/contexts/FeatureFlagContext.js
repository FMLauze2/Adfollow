import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const FeatureFlagContext = createContext({});

export const useFeatureFlags = () => useContext(FeatureFlagContext);

export const FeatureFlagProvider = ({ children }) => {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/featureflags");
        const obj = {};
        (res.data || []).forEach(f => { obj[f.name] = f.enabled; });
        setFlags(obj);
      } catch (e) {
        setFlags({});
      } finally {
        setLoading(false);
      }
    };
    fetchFlags();
  }, []);

  return (
    <FeatureFlagContext.Provider value={{ flags, loading }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};
