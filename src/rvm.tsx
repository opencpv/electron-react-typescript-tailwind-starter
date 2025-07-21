import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Recycle,
  Gift,
  Printer,
  Scale,
  Phone,
  Award,
  Sparkles,
  Zap,
  Star,
} from "lucide-react";
import printVoucherRequest from "./lib/print-woucher.api";

interface UserSession {
  totalPoints: number;
  sessions: any[]; // You might want to define a more specific type for sessions
}

const ReverseVendingMachine = () => {
  const [currentUser, setCurrentUser] = useState(null);
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
  const [detecting, setDetecting] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [showVoucher, setShowVoucher] = useState(false);
  const [voucherData, setVoucherData] = useState(null);
  const [celebration, setCelebration] = useState(false);

  const detectionTimeoutRef = useRef(null);

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

  const startSession = () => {
    if (!loginInput.trim()) return;

    const user = loginInput.trim();
    setCurrentUser(user);
    setSessionActive(true);
    setSessionStats({ plastic: 0, cans: 0, points: 0 });
    setLoginInput("");

    if (!userHistory[user]) {
      setUserHistory((prev) => ({
        ...prev,
        [user]: { totalPoints: 0, sessions: [] },
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

      if (isPlastic && plasticCapacity < 95) {
        setPlasticWeight((prev) => Math.round((prev + weight) * 100) / 100);
        setPlasticCapacity((prev) => Math.min(prev + 1, 100));
        setSessionStats((prev) => ({
          ...prev,
          plastic: prev.plastic + 1,
          points: prev.points + points,
        }));
      } else if (!isPlastic && canCapacity < 95) {
        setCanWeight((prev) => Math.round((prev + weight) * 100) / 100);
        setCanCapacity((prev) => Math.min(prev + 1, 100));
        setSessionStats((prev) => ({
          ...prev,
          cans: prev.cans + 1,
          points: prev.points + points,
        }));
      }

      // Celebration effect
      setCelebration(true);
      setTimeout(() => setCelebration(false), 1000);

      setDetecting(false);
    }, 1500);
  };

  const endSession = () => {
    if (!sessionActive) return;

    const sessionData = {
      date: new Date().toISOString(),
      plastic: sessionStats.plastic,
      cans: sessionStats.cans,
      points: sessionStats.points,
    };

    setUserHistory((prev) => ({
      ...prev,
      [currentUser]: {
        totalPoints: prev[currentUser].totalPoints + sessionStats.points,
        sessions: [...prev[currentUser].sessions, sessionData],
      },
    }));

    setVoucherData({
      user: currentUser,
      date: new Date(),
      plastic: sessionStats.plastic,
      cans: sessionStats.cans,
      points: sessionStats.points,
      totalPoints: userHistory[currentUser].totalPoints + sessionStats.points,
    });

    setShowVoucher(true);
    setSessionActive(false);
    setCurrentUser(null);
  };

  const printVoucher = () => {
    // alert("🎉 Voucher printed! Collect your reward at the counter!");
    printVoucherRequest({
      phone: voucherData.user as string,
      bottles: voucherData.plastic as number,
      cans: voucherData.cans as number,
    });
    // setShowVoucher(false);
    // setVoucherData(null);
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
            <p className="text-xl text-white/90 drop-shadow">
              A KNUST SHS STEM Club Project
            </p>
          </div>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg">
              <div className="text-3xl font-bold text-green-600">
                {plasticWeight}kg
              </div>
              <div className="text-sm text-gray-600">🟢 Plastic Collected</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg">
              <div className="text-3xl font-bold text-blue-600">
                {canWeight}kg
              </div>
              <div className="text-sm text-gray-600">🔵 Cans Collected</div>
            </div>
          </div>
          <div className="mb-4"></div>
          {/* Capacity Bars - Simplified */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <div className="text-center mb-2">
                <span className="text-2xl">🟢</span>
                <span className="ml-2 font-semibold">
                  Plastic {plasticCapacity}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div
                  className="h-6 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${plasticCapacity}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <div className="text-center mb-2">
                <span className="text-2xl">🔵</span>
                <span className="ml-2 font-semibold">
                  Aluminum {canCapacity}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div
                  className="h-6 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${canCapacity}%` }}
                ></div>
              </div>
            </div>
          </div>
          {/* Rewards Preview - Always Visible */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-white drop-shadow-lg">
                🎯 Awesome Rewards!
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
            /* Login Screen */
            <div className="max-w-md mx-auto">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 animate-bounce">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Ready to Recycle?
                  </h2>
                  <p className="text-gray-600">
                    Let's make the planet greener together! 🌍
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Phone number or username"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none text-lg font-medium transition-colors"
                    />
                  </div>

                  <button
                    onClick={startSession}
                    disabled={!loginInput.trim()}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-2xl font-bold text-xl hover:from-green-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    🚀 Start Recycling!
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active Session */
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Welcome Message */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 text-center shadow-2xl">
                <div className="text-3xl mb-2">👋 Welcome back!</div>
                <div className="text-xl font-bold text-gray-800">
                  {currentUser}
                </div>
                <div className="text-gray-600">
                  Let's recycle and earn points!
                </div>
              </div>

              {/* Session Stats - Big and Bold */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-6 text-center text-white shadow-xl transform hover:scale-105 transition-transform">
                  <div className="text-4xl font-bold mb-2">
                    {sessionStats.plastic}
                  </div>
                  <div className="text-lg">🟢 Bottles</div>
                </div>
                <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl p-6 text-center text-white shadow-xl transform hover:scale-105 transition-transform">
                  <div className="text-4xl font-bold mb-2">
                    {sessionStats.cans}
                  </div>
                  <div className="text-lg">🔵 Cans</div>
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
                    detecting || (plasticCapacity >= 95 && canCapacity >= 95)
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

                {plasticCapacity >= 95 && canCapacity >= 95 && (
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
        {showVoucher && voucherData && (
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
                      <span className="text-lg">🟢 Bottles:</span>
                      <span className="font-bold text-xl">
                        {voucherData.plastic}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg">🔵 Cans:</span>
                      <span className="font-bold text-xl">
                        {voucherData.cans}
                      </span>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="text-xl font-bold">⭐ Points:</span>
                      <span className="font-bold text-3xl text-purple-600">
                        +{voucherData.points}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={printVoucher}
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
