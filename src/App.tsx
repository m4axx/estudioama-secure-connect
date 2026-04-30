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

function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { img: 'h-7', text: 'text-lg' },
    md: { img: 'h-9', text: 'text-2xl' },
    lg: { img: 'h-14', text: 'text-5xl' },
  };
  return (
    <div className="flex items-center">
      <img
        src="/logo/AMA.png"
        alt="EstudioAMA"
        className={sizes[size].img}
        style={{ mixBlendMode: 'multiply' }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
          if (fb) fb.hidden = false;
        }}
      />
      <span hidden className={`font-black tracking-tighter leading-none ${sizes[size].text}`}>
        <span className="text-[#1c1c1c]">ESTUDIO</span>
        <span className="text-[#8d3030]">AMA</span>
      </span>
    </div>
  );
}

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
  const [isOrganizer, setIsOrganizer] = useState(false);

  const generateMeetingCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 9; i++) {
      if (i > 0 && i % 3 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomName(code);
    setIsOrganizer(true);
    toast.success("Código de sesión generado");
  };

  const joinMeeting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomName || !username) {
      toast.error("Introduce el código de sesión y tu nombre");
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
          toast.error("Error de configuración LiveKit");
        } else {
          toast.error(data.error);
        }
        return;
      }

      setToken(data.token);
      setWsUrl(data.wsUrl);
      setShowPrivacyModal(true);
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
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
    toast.error("Debes aceptar las políticas para continuar.");
  };

  const handleKicked = (reason: KickReason) => {
    setInCall(false);
    setKicked(reason);
    setToken('');
    setWsUrl('');
    setIsOrganizer(false);
  };

  // ── Pantalla de expulsión ──
  if (kicked === 'screenshot') {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full text-center"
        >
          <div className="w-20 h-20 bg-[#8d3030]/8 border border-[#8d3030]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-9 h-9 text-[#8d3030]" />
          </div>
          <h2 className="text-2xl font-black text-[#1c1c1c] tracking-tight mb-3">
            Sesión interrumpida
          </h2>
          <p className="text-[#1c1c1c]/60 text-sm leading-relaxed mb-2">
            Se detectó un intento de captura de pantalla.
          </p>
          <p className="text-[#1c1c1c]/35 text-xs leading-relaxed mb-10">
            Por las políticas de privacidad de{' '}
            <span className="text-[#8d3030] font-bold">EstudioAMA</span>, las capturas y grabaciones están
            estrictamente prohibidas. Este incidente ha sido registrado.
          </p>
          <Button
            onClick={() => { setKicked(null); setRoomName(''); setUsername(''); }}
            variant="ghost"
            className="text-[#1c1c1c]/50 hover:text-[#1c1c1c] text-xs uppercase tracking-widest border border-[#1c1c1c]/12 rounded-2xl px-6 py-3 h-auto bg-white hover:bg-white"
          >
            Volver al inicio
          </Button>
        </motion.div>
        <Toaster position="bottom-right" />
      </div>
    );
  }

  // ── En llamada ──
  if (inCall && token && wsUrl) {
    return (
      <div className="h-screen w-full bg-[#1c1c1c]">
        <CallRoom
          token={token}
          wsUrl={wsUrl}
          roomName={roomName}
          username={username}
          isOrganizer={isOrganizer}
          onDisconnect={() => { setInCall(false); setToken(''); setWsUrl(''); setIsOrganizer(false); }}
          onKicked={handleKicked}
        />
        <Toaster position="bottom-right" />
      </div>
    );
  }

  // ── Landing ──
  return (
    <div className="min-h-screen bg-[#f8f5f0] font-sans selection:bg-[#8d3030]/20 overflow-x-hidden text-[#1c1c1c]">
      {showPrivacyModal && (
        <PrivacyModal
          roomName={roomName}
          onAccept={handlePrivacyAccept}
          onDecline={handlePrivacyDecline}
        />
      )}

      {/* Fondo geométrico arquitectónico */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#fffefe] rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#8d3030]/4 rounded-full blur-3xl" />
        {/* Grid de puntos */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#1c1c1c" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-24">
        {/* Nav */}
        <nav className="flex items-center justify-between mb-20">
          <Logo size="md" />
          <div className="flex items-center gap-2 bg-[#fffefe]/80 border border-[#1c1c1c]/8 px-4 py-2 rounded-full shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] text-[#1c1c1c]/50 uppercase tracking-widest font-semibold">Cifrado activo</p>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Hero */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-[#8d3030]/8 border border-[#8d3030]/15 px-4 py-1.5 rounded-full mb-8"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#8d3030]" />
              <span className="text-[10px] font-bold text-[#8d3030] uppercase tracking-widest">Plataforma privada</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black text-[#1c1c1c] leading-[1.0] mb-6 tracking-tighter"
            >
              Sesiones<br />
              <span className="text-[#8d3030]">seguras</span><br />
              <span className="text-[#1c1c1c]/20">para AMA.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base text-[#1c1c1c]/55 mb-10 max-w-md leading-relaxed"
            >
              Videoconferencia con cifrado de extremo a extremo y protección
              anti-grabación para las sesiones críticas de{' '}
              <span className="text-[#8d3030] font-semibold">EstudioAMA</span>.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Button
                onClick={() => document.getElementById('meeting-card')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                className="bg-[#1c1c1c] hover:bg-[#1c1c1c]/85 text-white rounded-full px-8 h-13 text-sm font-semibold group transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#1c1c1c]/12 border-none"
              >
                Unirse a una sesión <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            <AnimatePresence>
              {configError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-4 bg-[#8d3030]/6 border border-[#8d3030]/15 rounded-2xl flex gap-3"
                >
                  <AlertCircle className="text-[#8d3030] w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#8d3030] font-bold text-sm mb-2 uppercase tracking-tight">Configuración requerida</p>
                    <div className="flex gap-2 flex-wrap">
                      <StatusBadge label="API_KEY" active={configError.apiKey} />
                      <StatusBadge label="API_SECRET" active={configError.apiSecret} />
                      <StatusBadge label="URL" active={configError.wsUrl} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card de acceso */}
          <motion.div
            id="meeting-card"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-[#fffefe] border border-[#1c1c1c]/8 shadow-[0_8px_48px_rgba(28,28,28,0.08)] rounded-[32px] overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-3.5 h-3.5 text-[#8d3030]" />
                  <span className="text-[10px] text-[#1c1c1c]/40 font-mono tracking-widest uppercase font-bold">Acceso seguro</span>
                </div>
                <CardTitle className="text-xl text-[#1c1c1c] font-black tracking-tight">Código de sesión</CardTitle>
                <CardDescription className="text-[#1c1c1c]/45 text-sm">
                  Introduce el código alfanumérico compartido por tu equipo.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold text-[#1c1c1c]/40 uppercase tracking-wider">Código</label>
                    <button
                      onClick={generateMeetingCode}
                      className="text-[10px] font-bold text-[#8d3030] hover:text-[#8d3030]/70 uppercase tracking-wider transition-colors"
                    >
                      Generar nuevo código
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1c1c1c]/25" />
                    <Input
                      placeholder="XXX-XXX-XXX"
                      className="bg-[#f8f5f0] border-[#1c1c1c]/10 pl-11 h-13 rounded-2xl focus-visible:ring-[#8d3030]/30 focus-visible:border-[#8d3030]/40 text-[#1c1c1c] font-mono uppercase text-center tracking-[0.2em] placeholder:text-[#1c1c1c]/25"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#1c1c1c]/40 uppercase tracking-wider">Tu nombre</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1c1c1c]/25" />
                    <Input
                      placeholder="Nombre completo"
                      className="bg-[#f8f5f0] border-[#1c1c1c]/10 pl-11 h-13 rounded-2xl focus-visible:ring-[#8d3030]/30 focus-visible:border-[#8d3030]/40 text-[#1c1c1c] placeholder:text-[#1c1c1c]/25"
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
                  className="w-full h-13 bg-[#8d3030] hover:bg-[#7a2828] text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-[#8d3030]/15 active:scale-[0.98] disabled:opacity-40 border-none"
                >
                  {loading ? "Autenticando..." : "Establecer conexión"}
                </Button>
              </CardFooter>

              <div className="px-6 pb-5 text-center">
                <p className="text-[9px] text-[#1c1c1c]/25 flex items-center justify-center gap-1.5 uppercase font-bold tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-[#8d3030]/50" />
                  Malla privada EstudioAMA activa
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-28 border-t border-[#1c1c1c]/8 pt-16">
          <Feature
            icon={<ShieldCheck className="w-5 h-5 text-[#8d3030]" />}
            title="Privacidad soberana"
            desc="Canales cifrados de extremo a extremo diseñados exclusivamente para comunicaciones internas de EstudioAMA."
          />
          <Feature
            icon={<Video className="w-5 h-5 text-[#8d3030]" />}
            title="Alta fidelidad"
            desc="Vídeo sin comprimir para revisión de proyectos arquitectónicos y colaboración en diseño digital."
          />
          <Feature
            icon={<Users className="w-5 h-5 text-[#8d3030]" />}
            title="Listo para auditoría"
            desc="Cada sesión incluye marcas forenses permanentes para trazabilidad de seguridad y cumplimiento normativo."
          />
        </div>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="w-11 h-11 bg-[#fffefe] border border-[#1c1c1c]/8 rounded-xl flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[#1c1c1c]">{title}</h3>
      <p className="text-[#1c1c1c]/45 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function StatusBadge({ label, active }: { label: string, active: boolean }) {
  return (
    <div className={`px-2 py-0.5 rounded text-[9px] font-mono flex items-center gap-1 border ${active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-[#8d3030]/5 border-[#8d3030]/20 text-[#8d3030]'}`}>
      <div className={`w-1 h-1 rounded-full ${active ? 'bg-emerald-500' : 'bg-[#8d3030]'}`} />
      {label}
    </div>
  );
}
