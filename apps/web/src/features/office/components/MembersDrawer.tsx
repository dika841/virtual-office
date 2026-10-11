import {
	PencilSimpleIcon,
	SignInIcon,
	UsersIcon,
	XIcon,
} from "@phosphor-icons/react";
import type { TPresenceEvent, TPresenceState } from "@virtual-office/schemas";
import { getCharacterIndex } from "./OfficeCanvas.tsx";

type TMembersDrawerProps = {
	isOpen: boolean;
	onClose: () => void;
	currentUser: {
		id: string;
		name: string;
		characterId: number;
		state: TPresenceState;
	};
	assignedDeskId: string;
	peers: TPresenceEvent[];
	isAuthenticated?: boolean;
	onOpenCharacterSelect?: () => void;
	onOpenAuthModal?: () => void;
};

function getStateBadgeColor(state: TPresenceState): string {
	switch (state) {
		case "working":
			return "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]";
		case "focus":
			return "bg-indigo-500 shadow-[0_0_8px_rgba(129,140,248,0.6)]";
		case "break":
			return "bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.6)]";
		default:
			return "bg-slate-500";
	}
}

export function MembersDrawer({
	isOpen,
	onClose,
	currentUser,
	assignedDeskId,
	peers,
	isAuthenticated,
	onOpenCharacterSelect,
	onOpenAuthModal,
}: TMembersDrawerProps) {
	if (!isOpen) return null;

	const myCharIdx = currentUser.characterId || 1;

	return (
		<div className="fixed inset-y-0 right-0 z-40 w-80 p-5 bg-[#0b0f19]/95 backdrop-blur-3xl border-l border-white/8 shadow-[0_0_60px_rgba(0,0,0,0.85)] flex flex-col justify-between">
			<div>
				<div className="flex items-center justify-between pb-4 border-b border-white/8">
					<div className="flex items-center gap-2">
						<UsersIcon size={18} className="text-emerald-400" />
						<h3 className="text-sm font-semibold text-white tracking-tight">
							Online Presence
						</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/6 transition cursor-pointer"
					>
						<XIcon size={18} />
					</button>
				</div>

				<div className="mt-4 space-y-2">
					{/* Self Card (Interactive to edit avatar) */}
					<div className="p-3 rounded-2xl bg-black/40 border border-white/8 shadow-inner flex items-center justify-between group">
						<div className="flex items-center gap-2.5">
							<div className="relative">
								<div className="w-10 h-10 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center p-0.5 overflow-hidden shadow-inner">
									<img
										src={`/assets/characters/char_${myCharIdx}.png`}
										alt={currentUser.name}
										className="w-full h-full object-contain [image-rendering:pixelated]"
									/>
								</div>
								<span
									className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black ${getStateBadgeColor(
										currentUser.state,
									)}`}
								/>
							</div>
							<div>
								<div className="text-xs font-semibold text-white flex items-center gap-1">
									<span>{currentUser.name}</span>
									<span className="text-[10px] text-emerald-400 font-mono">
										(You)
									</span>
								</div>
								<div className="text-[10px] font-mono text-slate-400 capitalize">
									{currentUser.state} • {isAuthenticated ? "Member" : "Guest"}
								</div>
							</div>
						</div>

						<div className="flex items-center gap-1.5">
							<span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/6 border border-white/8 text-slate-300">
								{assignedDeskId.toUpperCase()}
							</span>
							{onOpenCharacterSelect && (
								<button
									type="button"
									onClick={onOpenCharacterSelect}
									className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition cursor-pointer"
									title="Ganti Karakter & Nama"
								>
									<PencilSimpleIcon size={13} />
								</button>
							)}
						</div>
					</div>

					{/* Guest login callout if unauthenticated */}
					{!isAuthenticated && onOpenAuthModal && (
						<div className="p-3 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.1)]">
							<div className="text-[11px] text-slate-300">
								<p className="font-semibold text-emerald-400">
									Masuk dengan Akun
								</p>
								<p className="text-[10px] text-slate-400">
									Simpan absensi dan laporan kerja.
								</p>
							</div>
							<button
								type="button"
								onClick={onOpenAuthModal}
								className="px-2.5 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer active:scale-95"
							>
								<SignInIcon size={12} weight="bold" />
								<span>Masuk</span>
							</button>
						</div>
					)}

					{/* Peers List */}
					{peers.map((peer) => {
						const peerCharIdx =
							peer.characterId || getCharacterIndex(peer.userId);
						return (
							<div
								key={peer.userId}
								className="p-3 rounded-2xl bg-black/25 border border-white/6 flex items-center justify-between"
							>
								<div className="flex items-center gap-2.5">
									<div className="relative">
										<div className="w-10 h-10 rounded-xl bg-black/40 border border-white/8 flex items-center justify-center p-0.5 overflow-hidden">
											<img
												src={`/assets/characters/char_${peerCharIdx}.png`}
												alt={peer.userId}
												className="w-full h-full object-contain [image-rendering:pixelated]"
											/>
										</div>
										<span
											className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black ${getStateBadgeColor(
												peer.state,
											)}`}
										/>
									</div>
									<div>
										<div className="text-xs font-medium text-slate-200">
											{peer.userId.replace("usr_", "@")}
										</div>
										<div className="text-[10px] font-mono text-slate-400 capitalize">
											{peer.state}
										</div>
									</div>
								</div>
								<div className="text-[10px] font-mono text-slate-500">
									{peer.x}, {peer.y}
								</div>
							</div>
						);
					})}

					{peers.length === 0 && (
						<p className="text-xs text-slate-500 text-center py-6 font-mono text-[11px]">
							Belum ada rekan online saat ini.
						</p>
					)}
				</div>
			</div>

			<div className="pt-4 border-t border-white/8 text-center">
				<span className="text-[10px] font-mono text-slate-500">
					Koordinat efemeral (60s TTL)
				</span>
			</div>
		</div>
	);
}
