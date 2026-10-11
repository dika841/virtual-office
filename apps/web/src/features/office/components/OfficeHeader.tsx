import {
	BroadcastIcon,
	FileTextIcon,
	SignInIcon,
	SignOutIcon,
	SpeakerHighIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import type { TPresenceState } from "@virtual-office/schemas";

type TOfficeHeaderProps = {
	isClockedIn: boolean;
	currentState: TPresenceState;
	socketStatus: "connected" | "connecting" | "disconnected";
	totalOnline: number;
	currentUser: {
		name: string;
		characterId: number;
	};
	isAuthenticated?: boolean;
	voiceInfo?: {
		isMicEnabled: boolean;
		inRangeCount: number;
	};
	onOpenReports: () => void;
	onOpenMembers: () => void;
	onOpenCharacterSelect: () => void;
	onOpenAuthModal?: () => void;
	onSignOut?: () => void;
};

export function OfficeHeader({
	isClockedIn,
	currentState,
	socketStatus,
	totalOnline,
	currentUser,
	isAuthenticated,
	voiceInfo,
	onOpenReports,
	onOpenMembers,
	onOpenCharacterSelect,
	onOpenAuthModal,
	onSignOut,
}: TOfficeHeaderProps) {
	return (
		<header className="absolute top-4 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
			{/* Left: Double-Bezel Island for Profile & Workspace Status */}
			<div className="p-1 rounded-full bg-white/3 border border-white/8 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] pointer-events-auto">
				<div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#0b0f19]/90 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
					{/* User profile trigger */}
					<button
						type="button"
						onClick={onOpenCharacterSelect}
						className="flex items-center gap-2 hover:opacity-85 transition cursor-pointer active:scale-95"
						title="Klik untuk ubah nama atau avatar 8-bit"
					>
						<div className="w-7 h-7 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center p-0.5 overflow-hidden shadow-inner">
							<img
								src={`/assets/characters/char_${currentUser.characterId || 1}.png`}
								alt={currentUser.name}
								className="w-full h-full object-contain [image-rendering:pixelated]"
							/>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="text-xs font-semibold tracking-tight text-white max-w-30 truncate">
								{currentUser.name}
							</span>
							{isAuthenticated ? (
								<span
									className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
									title="Akun Terautentikasi"
								>
									PRO
								</span>
							) : (
								<span
									className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-white/6 text-slate-400 border border-white/10"
									title="Sesi Tamu"
								>
									GUEST
								</span>
							)}
						</div>
					</button>

					<div className="h-3.5 w-px bg-white/10" />

					{/* Presence state mode */}
					<span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
						<span
							className={`inline-block w-1.5 h-1.5 rounded-full shadow-sm ${
								currentState === "working"
									? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
									: currentState === "focus"
										? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]"
										: currentState === "break"
											? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
											: "bg-slate-500"
							}`}
						/>
						{isClockedIn ? `${currentState.toUpperCase()} MODE` : "OFFLINE"}
					</span>

					<div className="h-3.5 w-px bg-white/10" />

					{/* Spatial Voice Status */}
					<div
						className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400"
						title="P2P WebRTC Proximity Voice Audio"
					>
						<SpeakerHighIcon
							size={13}
							className={
								voiceInfo?.isMicEnabled
									? voiceInfo.inRangeCount > 0
										? "text-emerald-400 animate-pulse"
										: "text-emerald-500"
									: "text-slate-500"
							}
						/>
						<span>
							{currentState === "focus"
								? "MUTED"
								: voiceInfo?.isMicEnabled
									? voiceInfo.inRangeCount > 0
										? `VOICE (${voiceInfo.inRangeCount})`
										: "VOICE ON"
									: "VOICE OFF"}
						</span>
					</div>

					<div className="h-3.5 w-px bg-white/10" />

					{/* Realtime WebSocket indicator */}
					<div
						className="flex items-center gap-1 text-[10px] font-mono text-slate-400"
						title={`Edge WebSocket: ${socketStatus}`}
					>
						<BroadcastIcon
							size={13}
							className={
								socketStatus === "connected"
									? "text-emerald-400"
									: socketStatus === "connecting"
										? "text-amber-400 animate-pulse"
										: "text-rose-400"
							}
						/>
						<span>
							{socketStatus === "connected"
								? "SYNCED"
								: socketStatus.toUpperCase()}
						</span>
					</div>
				</div>
			</div>

			{/* Right: Island Action Pills with Double-Bezel Highlight */}
			<div className="flex items-center gap-2 pointer-events-auto">
				{isAuthenticated ? (
					<div className="p-0.5 rounded-full bg-white/3 border border-white/8 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
						<button
							type="button"
							onClick={onSignOut}
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0b0f19]/80 hover:bg-rose-950/30 border border-white/6 hover:border-rose-500/40 text-[11px] font-mono text-slate-400 hover:text-rose-300 transition shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] cursor-pointer active:scale-[0.98]"
							title="Keluar dari akun"
						>
							<SignOutIcon size={14} />
							<span>Keluar</span>
						</button>
					</div>
				) : (
					<div className="p-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 shadow-[0_4px_24px_rgba(16,185,129,0.15)]">
						<button
							type="button"
							onClick={onOpenAuthModal}
							className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 hover:text-emerald-200 transition shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] cursor-pointer active:scale-[0.98]"
						>
							<SignInIcon size={14} weight="bold" />
							<span>Masuk / Daftar</span>
						</button>
					</div>
				)}

				<div className="p-0.5 rounded-full bg-white/3 border border-white/8 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
					<button
						type="button"
						onClick={onOpenReports}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0b0f19]/80 hover:bg-[#121826] border border-white/6 text-[11px] font-mono text-slate-300 hover:text-white transition shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] cursor-pointer active:scale-[0.98]"
					>
						<FileTextIcon size={14} />
						<span>Daily Logs</span>
					</button>
				</div>

				<div className="p-0.5 rounded-full bg-white/3 border border-white/8 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
					<button
						type="button"
						onClick={onOpenMembers}
						className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0b0f19]/80 hover:bg-[#121826] border border-white/6 text-[11px] font-mono text-slate-300 hover:text-white transition shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] cursor-pointer active:scale-[0.98]"
					>
						<UsersIcon size={14} className="text-emerald-400" />
						<span>{totalOnline} Online</span>
					</button>
				</div>
			</div>
		</header>
	);
}
