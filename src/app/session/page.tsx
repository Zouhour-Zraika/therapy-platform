"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmojiPicker from "emoji-picker-react";
import { supabase } from "@/lib/supabase";
import Navbar from "../components/Navbar";

type Booking = {
  id: string;
  slot_day: string;
  slot_time: string;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
};

export default function SessionPage() {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [zoomUrl, setZoomUrl] = useState("");
  const [sessionInfo, setSessionInfo] = useState("");
  const [messages, setMessages] = useState([
    { text: "Hello, welcome to your session.", sender: "therapist" },
    { text: "Thank you, I am ready.", sender: "user" },
  ]);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getLatestPaidSession();
  }, []);

  const getLatestPaidSession = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isTherapist = profile?.role === "therapist";

    const { data, error } = await supabase
      .from("bookings")
      .select("id, slot_day, slot_time, zoom_join_url, zoom_start_url")
      .eq(isTherapist ? "therapist_id" : "patient_id", user.id)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log(error);
      setSessionInfo("No paid session found.");
      return;
    }

    const booking = data as Booking;

    setSessionInfo(`${booking.slot_day} at ${booking.slot_time}`);

    if (isTherapist) {
      setZoomUrl(booking.zoom_start_url || "");
    } else {
      setZoomUrl(booking.zoom_join_url || "");
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    setMessages([
      ...messages,
      {
        text: message,
        sender: "user",
      },
    ]);

    setMessage("");
  };

  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("session-files")
      .upload(fileName, file);

    if (error) {
      alert("Upload failed");
      console.log(error);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("session-files")
      .getPublicUrl(fileName);

    setMessages((prev) => [
      ...prev,
      {
        text: data.publicUrl,
        sender: "user",
      },
    ]);

    setUploading(false);
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100 p-10">
        <h1 className="mb-8 text-center text-5xl font-bold text-slate-900">
          Therapy Session
        </h1>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-black p-8 text-white shadow-lg lg:col-span-2">
            <div className="flex h-[500px] items-center justify-center rounded-2xl bg-slate-900">
              <div className="text-center">
                <p className="mb-4 text-3xl font-bold">Zoom Session</p>

                <p className="mb-8 text-slate-300">
                  {sessionInfo || "Loading your session..."}
                </p>

                {zoomUrl ? (
                  <a
                    href={zoomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl bg-white px-8 py-4 text-xl font-bold text-black"
                  >
                    Join Zoom Session
                  </a>
                ) : (
                  <p className="text-slate-400">
                    Zoom link not available yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              Session Chat
            </h2>

            <div className="mb-4 h-80 overflow-y-auto rounded-2xl bg-slate-100 p-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 rounded-2xl p-3 ${
                    msg.sender === "user"
                      ? "bg-black text-white"
                      : "bg-white text-slate-700"
                  }`}
                >
                  {msg.text.startsWith("http") ? (
                    <a href={msg.text} target="_blank" className="underline">
                      Open uploaded file
                    </a>
                  ) : (
                    msg.text
                  )}
                </div>
              ))}
            </div>

            <div className="relative mb-4 flex gap-2">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="rounded-2xl border border-slate-300 px-4 text-2xl"
              >
                😊
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-16 left-0 z-50">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}

              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                placeholder="Write a message..."
              />

              <button
                onClick={sendMessage}
                className="rounded-2xl bg-black px-5 text-white"
              >
                Send
              </button>
            </div>

            <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-400 p-6 text-center text-slate-600">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,image/*"
                onChange={handleFileUpload}
              />

              {uploading ? "Uploading..." : "Upload PDF, Word or image"}
            </label>
          </div>
        </section>
      </main>
    </>
  );
}