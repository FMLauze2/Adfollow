import React, { useEffect, useState } from "react";
import { subscribeToast } from "../utils/toast";

const COLORS = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-blue-600",
};

const ToastContainer = () => {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToast((toast) => {
      setQueue((prev) => [...prev, { id: Date.now(), ...toast }]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (queue.length === 0) return;
    const timer = setTimeout(() => {
      setQueue((prev) => prev.slice(1));
    }, 2800);
    return () => clearTimeout(timer);
  }, [queue]);

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {queue.map((t) => (
        <div
          key={t.id}
          className={`text-white px-4 py-2 rounded shadow-lg ${COLORS[t.type] || COLORS.info}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
