import React, { useState, useEffect, useRef } from "react";
import { Recycle, Printer, Sparkles, Zap, Star } from "lucide-react";
import printVoucherRequest from "./lib/print-woucher.api";
import { io } from "socket.io-client";
import { useAssets } from "./hooks/useAssets";

interface UserSession {
  totalPoints: number;
  sessions: any[]; // You might want to define a more specific type for sessions
}

interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

interface ClientToServerEvents {
  hello: () => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}

const ReverseVendingMachine = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [plasticWeight, setPlasticWeight] = useState(2.45);
  const [canWeight, setCanWeight] = useState(1.87);
  const [plasticCapacity, setPlasticCapacity] = useState(75);
  const [canCapacity, setCanCapacity] = useState(68);
  const [sessionStats, setSessionStats] = useState({
    plastic: 0,
    cans: 0,
    points: 0,
  });
  const [userHistory, setUserHistory] = useState<Record<string, UserSession>>(
    {}
  );
  const [weights, setWeights] = useState({
    plasticBin: 0,
    canBin: 0,
  });
  const [binCapacity, setbinCapacity] = useState({ plasticBin: 4, canBin: 5 });

  const [detecting, setDetecting] = useState(false);
  const [showVoucher, setShowVoucher] = useState(false);
  const [voucherData, setVoucherData] = useState(null);
  const [celebration, setCelebration] = useState(false);
  const [socket, setSocket] = useState<any>();
  const [status, setStatus] = useState<
    "idle" | "session-start" | "session-end"
  >("idle");
  const detectionTimeoutRef = useRef(null);
  const assets = useAssets();

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socket.on("connect", () => {
      console.log("Connected to server");
    });
    let theStatus = "idle";

    socket.on("enter", () => {
      if (theStatus === "idle") {
        theStatus = "session-start";
        startSession();
        console.log("Session started");
      } else if (theStatus === "session-start") {
        theStatus = "session-end";
        endSession();
        setShowVoucher(true);
        console.log("Session ended");
      } else if (theStatus === "session-end") {
        theStatus = "idle";
        printVoucherRequest({
          sessionId: currentSessionId,
          bottles: sessionStats.plastic,
          cans: sessionStats.cans,
        });
        setShowVoucher(false);
        setStatus("idle");
        setCurrentSessionId(null);
        setSessionActive(false);
        setSessionStats({ plastic: 0, cans: 0, points: 0 });
      }
    });

    socket.on("weight", (data) => {
      const weightData = data;
      console.log(weightData);
      setWeights(() => ({
        plasticBin: weightData.plasticWeight,
        canBin: weightData.canWeight,
      }));
      // Example: assume max capacity is 10kg for both bins
      setbinCapacity({
        plasticBin: Math.min(
          100,
          Math.round((weightData.plasticBin / 10) * 100)
        ),
        canBin: Math.min(100, Math.round((weightData.canBin / 10) * 100)),
      });
    });
    socket.on("capacity", (data) => {
      setbinCapacity(() => ({
        plasticBin: data.plasticBin,
        canBin: data.canBin,
      }));
    });

    setSocket(socket);
    return () => {
      socket.disconnect();
    };
  }, []);

  const rewards = [
    { name: "Pen", points: 50, color: "from-amber-400 to-orange-500" },
    {
      name: "Exercise Book",
      points: 100,
      color: "from-pink-400 to-rose-500",
    },
    {
      name: "Notebook",
      points: 150,
      color: "from-green-400 to-emerald-500",
    },
    { name: "₵5 Cash", points: 250, color: "from-blue-400 to-cyan-500" },
    {
      name: "₵10 Cash",
      points: 500,
      color: "from-purple-400 to-violet-500",
    },
    { name: "₵20 Cash", points: 750, color: "from-yellow-400 to-amber-500" },
  ];

  const generateSessionId = () => {
    return "RVM-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const startSession = () => {
    const sessionId = generateSessionId();
    setCurrentSessionId(sessionId);
    setSessionActive(true);
    setSessionStats({ plastic: 0, cans: 0, points: 0 });
    setStatus("session-start");
    if (!userHistory[sessionId]) {
      setUserHistory((prev) => ({
        ...prev,
        [sessionId]: { totalPoints: 0, sessions: [] },
      }));
    }
  };

  const simulateDetection = () => {
    if (!sessionActive || detecting) return;

    setDetecting(true);

    detectionTimeoutRef.current = setTimeout(() => {
      const isPlastic = Math.random() > 0.4;
      const weight = isPlastic ? 0.025 : 0.015;
      const points = isPlastic ? 2 : 3;
      const maxCapacityKg = 10; // adjust if your bin max is different

      setWeights((prev) => {
        let newPlastic = prev.plasticBin;
        let newCan = prev.canBin;
        if (isPlastic && binCapacity.plasticBin < 95) {
          newPlastic = Math.round((prev.plasticBin + weight) * 100) / 100;
          setSessionStats((prevStats) => ({
            ...prevStats,
            plastic: prevStats.plastic + 1,
            points: prevStats.points + points,
          }));
        } else if (!isPlastic && binCapacity.canBin < 95) {
          newCan = Math.round((prev.canBin + weight) * 100) / 100;
          setSessionStats((prevStats) => ({
            ...prevStats,
            cans: prevStats.cans + 1,
            points: prevStats.points + points,
          }));
        }
        // Update binCapacity based on new weights
        setbinCapacity({
          plasticBin: Math.min(
            100,
            Math.round((newPlastic / maxCapacityKg) * 100) || 0
          ),
          canBin:
            Math.min(100, Math.round((newCan / maxCapacityKg) * 100)) || 0,
        });
        return {
          plasticBin: newPlastic,
          canBin: newCan,
        };
      });

      // Celebration effect
      setCelebration(true);
      setTimeout(() => setCelebration(false), 1000);

      setDetecting(false);
    }, 1500);
  };

  const endSession = () => {
    // if (!sessionActive || !currentSessionId) return;

    const sessionData = {
      date: new Date().toISOString(),
      plastic: sessionStats.plastic,
      cans: sessionStats.cans,
      points: sessionStats.points,
    };

    setUserHistory((prev) => ({
      ...prev,
      [currentSessionId]: {
        totalPoints:
          (prev[currentSessionId]?.totalPoints || 0) + sessionStats.points,
        sessions: [...(prev[currentSessionId]?.sessions || []), sessionData],
      },
    }));

    setShowVoucher(true);
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 relative ">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-ping opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        ))}
      </div>

      {/* Celebration Effect */}
      {celebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce">
            <div className="text-6xl animate-pulse">🎉</div>
          </div>
          {[...Array(8)].map((_, i) => (
            <Star
              key={i}
              className={`absolute w-8 h-8 text-yellow-400 animate-ping`}
              style={{
                left: `${45 + Math.random() * 10}%`,
                top: `${45 + Math.random() * 10}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 p-10 h-screen grid grid-cols-2">
        <div>
          {/* Header */}
          <div className="text-center mb-4 p-5">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-2xl mb-4 animate-pulse">
              <Recycle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
              KMA Recycle 4 Cash
            </h1>
            <p className="text-3xl text-white/90 drop-shadow">
              KNUST SHS STEM Club Project
            </p>
          </div>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg flex flex-row items-center">
              <img
                src={assets.icons.bottleGif}
                alt=""
                className="w-[100px] h-[100px]"
              />
              <div className="flex flex-col">
                <div className="text-3xl font-black text-blue-600">
                  {weights.plasticBin}kg
                </div>
                <div className="text-sm font-bold text-gray-600">
                  Plastic bottles recycled
                </div>
              </div>
            </div>
            <div className="bg-white backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg flex flex-row items-center">
              <img
                src={assets.icons.canGif}
                alt=""
                className="w-[100px] h-[100px]"
              />
              <div className="flex flex-col">
                <div className="text-3xl font-black text-yellow-600">
                  {weights.canBin}kg
                </div>
                <div className="text-sm font-bold text-gray-600">
                  Aluminum cans recycled
                </div>
              </div>
            </div>
          </div>
          <div className="mb-4"></div>
          {/* Capacity Bars - Simplified */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <div className="flex gap- w-full items-center">
                <img
                  src={assets.icons.wasteBin}
                  alt=""
                  className="w-[60px] h-[60px]"
                />
                <div className="w-full flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="h-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${binCapacity.plasticBin}%` }}
                    ></div>
                  </div>
                  <span className="w-full text-center font-semibold">
                    Plastic Bin Capacity : {binCapacity.plasticBin}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <div className="flex gap- w-full items-center">
                <img
                  src={assets.icons.wasteBin}
                  alt=""
                  className="w-[60px] h-[60px]"
                />
                <div className="w-full flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="h-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-500"
                      style={{ width: `${binCapacity.canBin}%` }}
                    ></div>
                  </div>
                  <span className="w-full text-center font-semibold">
                    Aluminum Bin Capacity : {binCapacity.canBin}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Rewards Preview - Always Visible */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-white drop-shadow-lg">
                Awesome Rewards for Recycling
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {rewards.map((reward, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${reward.color} rounded-2xl p-4 text-center text-white shadow-xl transform hover:scale-105 transition-transform`}
                >
                  <div className="text-2xl font-bold mb-1">{reward.points}</div>
                  <div className="text-sm font-medium">{reward.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full flex flex-col items-center justify-center">
          {!sessionActive ? (
            /* Start Session Screen */
            <div className="max-w-md mx-auto">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 animate-bounce">
                    <Recycle className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Ready to Recycle?
                  </h2>
                  <p className="text-gray-600">
                    Let's make the planet greener together! 🌍
                  </p>
                </div>

                <button
                  onClick={startSession}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-2xl font-bold text-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  ♻️ Start Recycling!
                </button>
              </div>
            </div>
          ) : (
            /* Active Session */
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Session Info */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 text-center shadow-2xl">
                <div className="text-3xl mb-2">♻️ Active Session</div>
                <div className="text-sm font-mono bg-gray-100 p-2 rounded-lg inline-block">
                  {currentSessionId}
                </div>
                <div className="mt-2 text-gray-600">
                  Recycle items to earn points!
                </div>
              </div>

              {/* Session Stats - Big and Bold */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-3xl p-6 text-center text-white shadow-xl transform hover:scale-105 transition-transform">
                  <div className="text-4xl font-bold mb-2">
                    {sessionStats.plastic}
                  </div>
                  <div className="text-lg">Plastic bottle</div>
                </div>
                <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl p-6 text-center text-white shadow-xl transform hover:scale-105 transition-transform">
                  <div className="text-4xl font-bold mb-2">
                    {sessionStats.cans}
                  </div>
                  <div className="text-lg">Alumuminum can</div>
                </div>
                <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl p-6 text-center text-white shadow-xl transform hover:scale-105 transition-transform">
                  <div className="text-4xl font-bold mb-2">
                    {sessionStats.points}
                  </div>
                  <div className="text-lg">⭐ Points</div>
                </div>
              </div>

              {/* Insert Button - Hero Element */}
              <div className="text-center py-8">
                <button
                  onClick={simulateDetection}
                  disabled={
                    detecting ||
                    (plasticCapacity >= 95 && binCapacity.canBin >= 95)
                  }
                  className={`w-64 h-64 rounded-full text-2xl font-bold text-white shadow-2xl transition-all duration-300 ${
                    detecting
                      ? "bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse scale-110"
                      : "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:scale-110"
                  } disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed`}
                >
                  {detecting ? (
                    <div className="flex flex-col items-center">
                      <Zap className="w-12 h-12 mb-2 animate-spin" />
                      <div>Detecting...</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="text-6xl mb-2">📥</div>
                      <div>Insert Item!</div>
                    </div>
                  )}
                </button>

                {plasticCapacity >= 95 && binCapacity.canBin >= 95 && (
                  <p className="text-white text-lg mt-4 bg-red-500 rounded-full px-6 py-2 inline-block">
                    🚨 Machine Full - Contact Staff!
                  </p>
                )}
              </div>

              {/* End Session Button */}
              <button
                onClick={endSession}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-6 rounded-3xl font-bold text-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                🎁 Finish & Get My Reward!
              </button>
            </div>
          )}
        </div>

        {/* Voucher Modal */}
        {showVoucher && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full transform ">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Amazing!
                </h2>
                <p className="text-gray-600 mb-6">You've earned rewards!</p>

                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg">Plastic Bottles:</span>
                      <span className="font-bold text-xl">
                        {sessionStats?.plastic || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg">Aluminum Cans :</span>
                      <span className="font-bold text-xl">
                        {sessionStats?.cans || 0}
                      </span>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="text-xl font-bold">⭐ Points:</span>
                      <span className="font-bold text-3xl text-purple-600">
                        +{sessionStats?.points || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    printVoucherRequest(voucherData);
                    setShowVoucher(false);
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-2xl font-bold text-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                >
                  <Printer className="w-6 h-6" />
                  <span>🎫 Print My Voucher!</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReverseVendingMachine;
