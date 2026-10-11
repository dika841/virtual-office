import {
	ChatCircleDotsIcon,
	CircleNotchIcon,
	CoffeeIcon,
	CrosshairIcon,
	DoorOpenIcon,
	HeadphonesIcon,
	LaptopIcon,
	MicrophoneIcon,
	MicrophoneSlashIcon,
} from "@phosphor-icons/react";
import type { TPresenceState } from "@virtual-office/schemas";

type TDockBarProps = {
	state: TPresenceState;
	isClockedIn: boolean;
	isLoading?: boolean;
	isMicEnabled?: boolean;
	isSpeaking?: boolean;
	isChatOpen?: boolean;
	onClockIn: () => void;
	onClockOutPrompt: () => void;
	onSetState: (state: TPresenceState) => void;
	onToggleMic?: () => void;
	onToggleChat?: () => void;
};

export function DockBar({
	state,
	isClockedIn,
	isLoading = false,
	isMicEnabled = false,
	isSpeaking = false,
	isChatOpen = false,
	onClockIn,
	onClockOutPrompt,
	onSetState,
	onToggleMic,
	onToggleChat,
}: TDockBarProps) {
	return (
		<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 p-1.5 rounded-full bg-white/4 border border-white/8 backdrop-blur-3xl shadow-[0_16px_48px_rgba(0,0,0,0.8)]">
			<div className="flex items-center gap-1.5 p-1 rounded-full bg-[#0b0f19]/90 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
				{!isClockedIn ? (
					<button
						type="button"
						onClick={onClockIn}
						disabled={isLoading}
						className="group flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-semibold text-xs tracking-wide transition-all duration-300 ease-spring active:scale-[0.98] shadow-[0_0_24px_rgba(16,185,129,0.35)] cursor-pointer"
					>
						<div className="w-5 h-5 rounded-full bg-black/15 flex items-center justify-center shrink-0">
							{isLoading ? (
								<CircleNotchIcon
									size={13}
									weight="bold"
									className="animate-spin"
								/>
							) : (
								<LaptopIcon size={13} weight="bold" />
							)}
						</div>
						<span>{isLoading ? "Clocking In..." : "Clock In"}</span>
					</button>
				) : (
					<>
						<button
							type="button"
							onClick={() => onSetState("working")}
							className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
								state === "working"
									? "bg-white/12 text-white border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
									: "text-slate-400 hover:text-white hover:bg-white/5"
							}`}
						>
							<CrosshairIcon
								size={14}
								weight={state === "working" ? "bold" : "regular"}
								className={state === "working" ? "text-emerald-400" : ""}
							/>
							<span>Desk</span>
						</button>

						<button
							type="button"
							onClick={() => onSetState("focus")}
							className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
								state === "focus"
									? "bg-indigo-600/90 text-white border border-indigo-400/30 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
									: "text-slate-400 hover:text-white hover:bg-white/5"
							}`}
						>
							<HeadphonesIcon
								size={14}
								weight={state === "focus" ? "bold" : "regular"}
							/>
							<span>Focus</span>
						</button>

						<button
							type="button"
							onClick={() => onSetState("break")}
							className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
								state === "break"
									? "bg-amber-500/90 text-slate-950 border border-amber-300/40 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
									: "text-slate-400 hover:text-white hover:bg-white/5"
							}`}
						>
							<CoffeeIcon
								size={14}
								weight={state === "break" ? "bold" : "regular"}
							/>
							<span>Pantry</span>
						</button>

						<div className="h-4 w-px bg-white/10 mx-0.5" />

						{/* Spatial Audio Microphone Toggle */}
						<button
							type="button"
							onClick={onToggleMic}
							disabled={state === "focus"}
							title={
								state === "focus"
									? "Audio nonaktif dalam Deep Focus"
									: isMicEnabled
										? "Bisukan Mikrofon"
										: "Aktifkan Mikrofon"
							}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
								state === "focus"
									? "opacity-40 cursor-not-allowed text-slate-500"
									: isMicEnabled
										? isSpeaking
											? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.3)] animate-pulse"
											: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
										: "text-slate-400 hover:text-white hover:bg-white/5"
							}`}
						>
							{isMicEnabled && state !== "focus" ? (
								<MicrophoneIcon
									size={14}
									weight="bold"
									className={
										isSpeaking ? "text-emerald-300" : "text-emerald-400"
									}
								/>
							) : (
								<MicrophoneSlashIcon size={14} />
							)}
							<span>
								{state === "focus"
									? "Muted"
									: isMicEnabled
										? isSpeaking
											? "Speaking"
											: "Mic On"
										: "Mic Off"}
							</span>
						</button>

						<div className="h-4 w-px bg-white/10 mx-0.5" />

						{/* Bubble Chat Button */}
						<button
							type="button"
							onClick={onToggleChat}
							title="Kirim Bubble Chat (atau tekan Enter)"
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
								isChatOpen
									? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.25)]"
									: "text-slate-300 hover:text-white hover:bg-white/5"
							}`}
						>
							<ChatCircleDotsIcon
								size={14}
								weight={isChatOpen ? "bold" : "regular"}
								className={isChatOpen ? "text-emerald-400" : "text-slate-400"}
							/>
							<span>Chat</span>
						</button>

						<div className="h-4 w-px bg-white/10 mx-0.5" />

						<button
							type="button"
							onClick={onClockOutPrompt}
							disabled={isLoading}
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-rose-400 hover:text-rose-200 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 disabled:opacity-50 transition-all duration-200 active:scale-95 cursor-pointer"
						>
							<DoorOpenIcon size={14} />
							<span>Clock Out</span>
						</button>
					</>
				)}
			</div>
		</div>
	);
}
