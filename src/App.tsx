import React, { useState } from 'react';
import { CallRoom } from './components/CallRoom';
import { PrivacyModal } from './components/PrivacyModal';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { ShieldCheck, Video, Users, Lock, ChevronRight, AlertCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import "@livekit/components-styles";

type KickReason = 'screenshot' | null;

export default function App() {
  const [inCall, setInCall] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [kicked, setKicked] = useState<KickReason>(null);
  const [roomName, setRoomName] = useState('');
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [wsUrl, setWsUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState<null | { apiKey: boolean, apiSecret: boolean, wsUrl: boolean }>(null);

  const generateMeetingCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 9; i++) {
      if (i > 0 && i % 3 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomName(code);
    toast.success("Meeting code generated!");
  };

  const joinMeeting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomName || !username) {
      toast.error("Please enter a meeting code and your name");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomName, identity: username })
      });
      const data = await resp.json();

      if (data.error) {
        if (data.configured) {
          setConfigError(data.configured);
          toast.error("LiveKit configuration error");
        } else {
          toast.error(data.error);
        }
        return;
      }

      setToken(data.token);
      setWsUrl(data.wsUrl);
      // Show privacy modal before entering the call
      setShowPrivacyModal(true);
    } catch (err) {
      console.error(err);
      toast.error("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyAccept = () => {
    setShowPrivacyModal(false);
    setInCall(true);
  };

  const handlePrivacyDecline = () => {
    setShowPrivacyModal(false);
    setToken('');
    setWsUrl('');
    toast.error("Debes aceptar las políticas para unirte.");
  };

  const handleKicked = (reason: KickReason) => {
    setInCall(false);
    setKicked(reason);
    setToken('');
    setWsUrl('');
  };

  // ── Kicked screen ──
  if (kicked === 'screenshot') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full text-center"
        >
          <div className="w-20 h-20 bg-red-600/10 border border-red-600/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-3">
            Expulsado de la sesión
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-2">
            Se detectó un intento de captura de pantalla.
          </p>
          <p className="text-slate-600 text-xs leading-relaxed mb-8">
            Por políticas de privacidad de <span className="text-red-500 font-bold">EstudioAMA</span>, las capturas de pantalla y grabaciones están estrictamente prohibidas. Este incidente ha sido registrado.
          </p>
          <Button
            onClick={() => { setKicked(null); setRoomName(''); setUsername(''); }}
            variant="ghost"
            className="text-slate-500 hover:text-white text-xs uppercase tracking-widest border border-slate-800 rounded-2xl px-6 py-3 h-auto"
          >
            Volver al inicio
          </Button>
        </motion.div>
        <Toaster position="bottom-right" theme="dark" />
      </div>
    );
  }

  // ── In call ──
  if (inCall && token && wsUrl) {
    return (
      <div className="h-screen w-full bg-black">
        <CallRoom
          token={token}
          wsUrl={wsUrl}
          roomName={roomName}
          username={username}
          onDisconnect={() => { setInCall(false); setToken(''); setWsUrl(''); }}
          onKicked={handleKicked}
        />
        <Toaster position="bottom-right" theme="dark" />
      </div>
    );
  }

  // ── Landing page ──
  return (
    <div className="min-h-screen bg-[#050505] font-sans selection:bg-red-500/30 overflow-x-hidden text-slate-200">
      {/* Privacy modal shown after token is fetched */}
      {showPrivacyModal && (
        <PrivacyModal
          roomName={roomName}
          onAccept={handlePrivacyAccept}
          onDecline={handlePrivacyDecline}
        />
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.1),transparent_50%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <nav className="flex items-center justify-between mb-24">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-red-500/20 italic">A</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter text-white leading-none">Estudio<span className="text-red-500 font-black">AMA</span></h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Secure Encryption Active</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Button variant="ghost" className="text-white hover:text-red-500 text-xs uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-opacity">
              Security protocol
            </Button>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-7xl font-bold text-white leading-[1.1] mb-8 tracking-tighter"
            >
              Estudio<span className="text-red-600 font-black">AMA</span> <br />
              <span className="text-white/20">Secure.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-400 mb-10 max-w-lg leading-relaxed"
            >
              Enterprise-grade conferencing with forensic anti-recording protection.
              Private channels for <span className="text-red-500 font-bold">EstudioAMA</span> critical sessions.
            </motion.p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => document.getElementById('meeting-card')?.scrollIntoView({ behavior: 'smooth' })} size="lg" className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 h-14 text-base font-semibold group transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20">
                Join Meeting <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <AnimatePresence>
              {configError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-[24px] flex gap-3"
                >
                  <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-bold text-sm mb-1 uppercase tracking-tight">Configuration Required</p>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <StatusBadge label="API_KEY" active={configError.apiKey} />
                      <StatusBadge label="API_SECRET" active={configError.apiSecret} />
                      <StatusBadge label="URL" active={configError.wsUrl} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            id="meeting-card"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-3xl shadow-2xl rounded-[32px] overflow-hidden border">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase font-bold">Secure Access Gate</span>
                </div>
                <CardTitle className="text-2xl text-white">Enter Meeting Code</CardTitle>
                <CardDescription className="text-slate-500">
                  Provide the shared alphanumeric identity to connect.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meeting Code</label>
                    <button
                      onClick={generateMeetingCode}
                      className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-wider transition-colors"
                    >
                      Generate New Code
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <Input
                      placeholder="XXX-XXX-XXX"
                      className="bg-[#050505] border-slate-800 pl-10 h-14 rounded-2xl focus-visible:ring-red-600 text-white font-mono uppercase text-center tracking-[0.2em]"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Identity</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <Input
                      placeholder="Your Name"
                      className="bg-[#050505] border-slate-800 pl-10 h-14 rounded-2xl focus-visible:ring-red-600 text-white"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && joinMeeting()}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => joinMeeting()}
                  disabled={loading}
                  className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50 border-none"
                >
                  {loading ? "Authenticating..." : "Establish Connection"}
                </Button>
              </CardFooter>
              <div className="px-6 pb-6 text-center">
                <p className="text-[10px] text-slate-600 flex items-center justify-center gap-1.5 uppercase font-bold tracking-tighter">
                  <ShieldCheck className="w-3 h-3 text-red-500" />
                  EstudioAMA Private Mesh Active
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-32 border-t border-slate-900 pt-16">
          <Feature
            icon={<ShieldCheck className="w-6 h-6 text-red-500" />}
            title="Sovereign Privacy"
            desc="End-to-end encrypted tunnels designed specifically for EstudioAMA internal communications."
          />
          <Feature
            icon={<Video className="w-6 h-6 text-red-500" />}
            title="High Fidelity"
            desc="Uncompressed video streams for architectural review and digital design collaboration."
          />
          <Feature
            icon={<Users className="w-6 h-6 text-red-500" />}
            title="Audit Ready"
            desc="Every session includes permanent forensic markers for compliance and security tracing."
          />
        </div>
      </div>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center ring-1 ring-neutral-800">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function StatusBadge({ label, active }: { label: string, active: boolean }) {
  return (
    <div className={`px-1.5 py-0.5 rounded text-[9px] font-mono flex items-center gap-1 border ${active ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
      <div className={`w-1 h-1 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
      {label}
    </div>
  );
}
