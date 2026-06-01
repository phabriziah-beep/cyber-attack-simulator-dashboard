import "./App.css";
import { useEffect, useState, useRef } from "react";
import socket from "./socket";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

function App() {
  /* ================== STATE ================== */

  const [logs, setLogs] = useState(["[BOOT] Initializing CASD..."]);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [mode, setMode] = useState("MIXED");

  const [riskScore, setRiskScore] = useState(0);

  const [attackStats, setAttackStats] = useState({
    DDoS: 0,
    SQL: 0,
    BRUTE: 0,
    PHISHING: 0,
    MIXED: 0
  });

  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [vulnerabilityThreshold, setVulnerabilityThreshold] = useState(5);

  const [trainingScore, setTrainingScore] = useState(50);
  const [detected, setDetected] = useState(0);
  const [missed, setMissed] = useState(0);
  const [effectiveness, setEffectiveness] = useState(0);
  const [responseTimes, setResponseTimes] = useState([]);

  const [chartData, setChartData] = useState([]);

  /* ================== SOC ALERT ================== */
  const [alert, setAlert] = useState(null);

  const logsRef = useRef(null);

  /* ================== SOCKET ================== */

  useEffect(() => {
    setLogs((prev) => [...prev, "[INFO] Connecting to SOC backend..."]);

    socket.on("connect", () => {
      setLogs((prev) => [...prev, `[INFO] Connected: ${socket.id}`]);
    });

    socket.on("attack", (data) => {
      const type = data.type || "MIXED";
      const severityRaw = data.severity || "LOW";
      const severity = severityRaw.toLowerCase();

      /* ================= ALERT SYSTEM ================= */
      if (severityRaw === "CRITICAL") {
        setAlert({
          type,
          message: "CRITICAL THREAT DETECTED",
          time: new Date().toLocaleTimeString()
        });

        new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg").play();

        setTimeout(() => setAlert(null), 4000);
      }

      /* ================= HISTORY ================= */
      setHistory((prev) => [...prev.slice(-49), { ...data, type, severity }]);

      /* ================= LOGS ================= */
      setLogs((prev) => [
        ...prev.slice(-49),
        `[${severityRaw}] ${type}`
      ]);

      /* ================= CHART ================= */
      const intensity =
        severityRaw === "CRITICAL"
          ? 100
          : severityRaw === "HIGH"
          ? 75
          : severityRaw === "MEDIUM"
          ? 50
          : 25;

      setChartData((prev) => [
        ...prev.slice(-49),
        {
          time: new Date().toLocaleTimeString(),
          intensity
        }
      ]);

      /* ================= RISK ================= */
      setRiskScore((prev) =>
        Math.min(100, prev + intensity * 0.15)
      );

      /* ================= STATS ================= */
      setAttackStats((prev) => ({
        ...prev,
        [type]: (prev[type] || 0) + 1
      }));

      /* ================= VULNERABILITIES ================= */
      setVulnerabilities((prev) => {
        const list = [...prev];

        if (
          type === "SQL" &&
          !list.includes("⚠ SQL INJECTION VULNERABILITY")
        ) {
          list.push("⚠ SQL INJECTION VULNERABILITY");
        }

        if (
          type === "DDoS" &&
          !list.includes("⚠ NETWORK LAYER ATTACK DETECTED")
        ) {
          list.push("⚠ NETWORK LAYER ATTACK DETECTED");
        }

        return list.slice(-5);
      });

      /* ================= TRAINING ================= */
      if (severityRaw === "CRITICAL") {
        const detectedChance = Math.random() > 0.3;
        const responseTime = Math.floor(Math.random() * 8) + 2;

        if (detectedChance) {
          setDetected((d) => d + 1);
          setTrainingScore((t) => Math.min(100, t + 2));
          setResponseTimes((prev) => [...prev.slice(-19), responseTime]);
        } else {
          setMissed((m) => m + 1);
          setTrainingScore((t) => Math.max(0, t - 3));
        }
      }
    });

    socket.on("disconnect", () => {
      setLogs((prev) => [
        ...prev,
        "[WARNING] Disconnected from SOC server"
      ]);
    });

    return () => {
      socket.off("connect");
      socket.off("attack");
      socket.off("disconnect");
    };
  }, []);

  /* ================== EFFECTIVENESS ================== */

  useEffect(() => {
    const total = detected + missed;

    if (total > 0) {
      const accuracy = (detected / total) * 100;

      setEffectiveness(
        Math.round(accuracy * 0.6 + trainingScore * 0.4)
      );
    }
  }, [detected, missed, trainingScore]);

  /* ================== AUTO SCROLL ================== */

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop =
        logsRef.current.scrollHeight;
    }
  }, [logs]);

  /* ================== FILTER ================== */

  const filtered =
    filter === "ALL"
      ? history
      : history.filter((a) => a.severity === filter);

  const avgResponseTime =
    responseTimes.length > 0
      ? (
          responseTimes.reduce((a, b) => a + b, 0) /
          responseTimes.length
        ).toFixed(1)
      : 0;

  /* ================== RESET ================== */

  const resetSimulation = () => {
    setLogs(["[BOOT] System Reset Complete..."]);
    setHistory([]);
    setChartData([]);
    setRiskScore(0);
    setAttackStats({
      DDoS: 0,
      SQL: 0,
      BRUTE: 0,
      PHISHING: 0,
      MIXED: 0
    });
    setVulnerabilities([]);
    setTrainingScore(50);
    setDetected(0);
    setMissed(0);
    setEffectiveness(0);
    setResponseTimes([]);
    setFilter("ALL");
  };

  /* ================== UI ================== */

  return (
    <div className="app">

      {/* ALERT */}
      {alert && (
        <div className="soc-alert">
          🚨 {alert.message} <br />
          {alert.type} @ {alert.time}
        </div>
      )}

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>CASD SOC</h2>

        <button className="soc-reset-btn" onClick={resetSimulation}>
  ⚠ EMERGENCY RESET
</button>
      </div>

      {/* MAIN */}
      <div className="main dashboard">

        <h1>CYBER ATTACK SIMULATOR DASHBOARD</h1>

        {/* KPI */}
        <div className={`risk-card ${riskScore > 70 ? "danger" : riskScore > 40 ? "warning" : "safe"}`}>
  
  <h3>THREAT LEVEL</h3>

  <div className="risk-meter">
    <div
      className="risk-fill"
      style={{ width: `${riskScore}%` }}
    />
  </div>

  <div className="risk-meta">
    <span>Risk Score</span>
    <span className="risk-value">{Math.round(riskScore)}%</span>
  </div>

</div>
        <div className="card">Training Score: {trainingScore}</div>
        <div className="card">Effectiveness: {effectiveness}%</div>
        <div className="card">Avg Response: {avgResponseTime}s</div>

        {/* CHART */}
        <div className="card">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line dataKey="intensity" stroke="#22d3ee" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* LOGS */}
        <div className="card logs" ref={logsRef}>
          <h3>System Logs</h3>
          {logs.map((l, i) => <p key={i}>{l}</p>)}
        </div>

        {/* ATTACK FEED */}
        <div className="card">
          <h3>Live Threat Feed</h3>

          {filtered.map((a, i) => (
            <div key={i} className={`attack ${a.severity?.toLowerCase()}`}>
              {a.type} — {a.severity}
            </div>
          ))}
        </div>

        {/* VULNERABILITIES */}
        <div className="card">
          <h3>Vulnerabilities</h3>
          {vulnerabilities.length === 0
            ? "No threats detected"
            : vulnerabilities.map((v, i) => <p key={i}>{v}</p>)}
        </div>

      </div>
    </div>
  );
}

export default App;