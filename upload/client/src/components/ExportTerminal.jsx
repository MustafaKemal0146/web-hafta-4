import { useEffect, useRef } from "react";

export default function ExportTerminal({ logs }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs]);

  return (
    <pre className="terminal" ref={ref}>
      {logs || <span className="terminal-placeholder">$ Waiting for export command to start…</span>}
    </pre>
  );
}
