"use client";

import { useState } from "react";

export function InteractiveDemo() {
  const [message, setMessage] = useState("");
  const [expiry, setExpiry] = useState("24h");
  const [key, setKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setKey("X7K9-M2P4");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <section className="section">
      <div className="max-w-narrow mx-auto px-6">
        <div className="text-center mb-12">
          <div className="font-mono text-xs tracking-widest uppercase text-black/30 mb-4">
            Try It Now
          </div>
          <h2 className="font-ui text-4xl font-bold tracking-tight mb-4">
            Send a secret in seconds
          </h2>
          <p className="text-black/50 max-w-md mx-auto">
            No signup required. Type a message, get a key, and share it.
          </p>
        </div>

        <div className="glass rounded-3xl p-8">
          {/* Message Input */}
          <div className="mb-6">
            <label className="font-mono text-xs tracking-widest uppercase text-black/40 mb-3 block">
              Secret Message
            </label>
            <textarea
              className="input-glass rounded-2xl p-5 w-full min-h-[100px] text-sm text-black placeholder:text-black/30 font-mono resize-none"
              placeholder="Type your secret here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Expiry Selector */}
          <div className="mb-6">
            <label className="font-mono text-xs tracking-widest uppercase text-black/40 mb-3 block">
              Expires After
            </label>
            <div className="flex gap-3">
              {["1h", "24h", "7d"].map((option) => (
                <button
                  key={option}
                  onClick={() => setExpiry(option)}
                  className={`rounded-xl px-5 py-3 font-mono text-xs tracking-wider transition-smooth ${
                    expiry === option
                      ? "btn-black"
                      : "btn-ghost"
                  }`}
                >
                  {option === "1h" ? "1 Hour" : option === "24h" ? "24 Hours" : "7 Days"}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !message.trim()}
            className="btn-black w-full py-4 rounded-2xl font-ui font-semibold text-sm tracking-wide uppercase transition-smooth mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Encrypting..." : "Encrypt & Generate Key"}
          </button>

          {/* Key Result */}
          {key && (
            <div className="glass rounded-2xl p-6 border border-black/5 key-glow">
              <div className="flex items-center justify-between mb-2">
                <div className="font-mono text-xs tracking-widest uppercase text-black/40">
                  Share Link
                </div>
                <span className="font-mono text-xs tracking-wider text-black/30">Copied</span>
              </div>
              <div className="font-mono text-3xl tracking-widest font-semibold text-black mb-3">
                {key}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                <span className="font-mono text-xs text-black/30 tracking-wider">
                  Share this key with the recipient
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
