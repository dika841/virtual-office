import { CheckIcon, SparkleIcon, UserIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";

export const CHARACTER_PRESETS = [
	{
		id: 1,
		name: "Alex",
		title: "Audio & Web Hacker",
		description: "Green hoodie, headphones & optical mouse",
		src: "/assets/characters/char_1.png",
	},
	{
		id: 2,
		name: "Sarah",
		title: "Systems Architect",
		description: "Round glasses, ponytail & laptop",
		src: "/assets/characters/char_2.png",
	},
	{
		id: 3,
		name: "Devin",
		title: "Backend Engineer",
		description: "Cozy grey hoodie & dark jeans",
		src: "/assets/characters/char_3.png",
	},
	{
		id: 4,
		name: "Neko-9",
		title: "Cyber AI Cat",
		description: "Futuristic mecha feline with terminal visor",
		src: "/assets/characters/char_4.png",
	},
	{
		id: 5,
		name: "Elena",
		title: "Product Engineer",
		description: "Purple knit sweater & endless coffee",
		src: "/assets/characters/char_5.png",
	},
	{
		id: 6,
		name: "Kenji",
		title: "Tech Lead",
		description: "Corporate badge & analytics tablet",
		src: "/assets/characters/char_6.png",
	},
] as const;

type TCharacterSelectModalProps = {
	isOpen: boolean;
	currentName: string;
	currentCharacterId: number;
	onClose: () => void;
	onSave: (updates: { name: string; characterId: number }) => void;
};

export function CharacterSelectModal({
	isOpen,
	currentName,
	currentCharacterId,
	onClose,
	onSave,
}: TCharacterSelectModalProps) {
	const [name, setName] = useState(currentName);
	const [selectedCharId, setSelectedCharId] = useState(currentCharacterId);

	if (!isOpen) return null;

	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) return;
		onSave({ name: trimmed, characterId: selectedCharId });
		onClose();
	};

	const currentPreset =
		CHARACTER_PRESETS.find((p) => p.id === selectedCharId) ||
		CHARACTER_PRESETS[0];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
			{/* Double-Bezel Hardware Architecture */}
			<div className="relative w-full max-w-xl p-2 rounded-4xl bg-white/3 border border-white/10 backdrop-blur-3xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-slate-100">
				<div className="p-6 rounded-[1.5rem] bg-[#0b0f19]/95 border border-white/6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col max-h-[90vh]">
					{/* Header */}
					<div className="flex items-center justify-between pb-4 border-b border-white/8">
						<div className="flex items-center gap-2.5">
							<div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
								<SparkleIcon size={18} weight="bold" />
							</div>
							<div>
								<h2 className="text-base font-semibold text-white tracking-tight">
									Pilih Karakter & Profil 8-Bit
								</h2>
								<p className="text-xs text-slate-400">
									Sesuaikan nama dan avatar 2D pixel art Anda di ruang kerja.
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/8 transition cursor-pointer"
						>
							<XIcon size={18} />
						</button>
					</div>

					<form
						onSubmit={handleSave}
						className="mt-5 space-y-5 overflow-y-auto pr-1"
					>
						{/* Name input */}
						<div className="space-y-1.5">
							<label
								htmlFor="user-display-name"
								className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5"
							>
								<UserIcon size={13} />
								<span>Nama Tampilan</span>
							</label>
							<input
								id="user-display-name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								maxLength={24}
								placeholder="Nama Anda"
								className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/40 shadow-inner transition"
							/>
						</div>

						{/* 6-character Selection Grid */}
						<div className="space-y-2">
							<div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
								Pilih Avatar Pixel Art ({CHARACTER_PRESETS.length} Pilihan)
							</div>

							<div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
								{CHARACTER_PRESETS.map((preset) => {
									const isSelected = selectedCharId === preset.id;
									return (
										<button
											key={preset.id}
											type="button"
											onClick={() => setSelectedCharId(preset.id)}
											className={`group relative p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-center gap-2 active:scale-[0.98] ${
												isSelected
													? "bg-emerald-950/30 border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-[0_0_16px_rgba(16,185,129,0.2)]"
													: "bg-black/35 border-white/7 hover:border-white/20 hover:bg-black/50"
											}`}
										>
											{/* Sprite Image Container */}
											<div className="w-16 h-16 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center p-1 overflow-hidden relative shadow-inner">
												<img
													src={preset.src}
													alt={preset.name}
													className="w-full h-full object-contain [image-rendering:pixelated] group-hover:scale-105 transition-transform"
												/>
											</div>

											{/* Character title info */}
											<div className="text-center w-full">
												<div className="text-xs font-semibold text-white truncate">
													{preset.name}
												</div>
												<div className="text-[10px] font-mono text-slate-400 truncate">
													{preset.title}
												</div>
											</div>

											{/* Selected badge mark */}
											{isSelected && (
												<div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-sm">
													<CheckIcon size={10} weight="bold" />
												</div>
											)}
										</button>
									);
								})}
							</div>
						</div>

						{/* Live Spotlight Preview Card */}
						<div className="p-3.5 rounded-2xl bg-black/45 border border-white/8 flex items-center gap-4 shadow-inner">
							<div className="w-14 h-14 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-inner">
								<img
									src={currentPreset.src}
									alt={currentPreset.name}
									className="w-full h-full object-contain [image-rendering:pixelated]"
								/>
							</div>
							<div className="text-xs space-y-0.5">
								<div className="font-semibold text-white flex items-center gap-2">
									<span>{name || "User"}</span>
									<span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
										{currentPreset.title}
									</span>
								</div>
								<p className="text-[11px] text-slate-400">
									{currentPreset.description}
								</p>
							</div>
						</div>

						{/* Actions */}
						<div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/8">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/6 transition cursor-pointer"
							>
								Batal
							</button>
							<button
								type="submit"
								className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs tracking-wide transition-all active:scale-[0.98] shadow-[0_0_24px_rgba(16,185,129,0.35)] cursor-pointer"
							>
								<CheckIcon size={14} weight="bold" />
								<span>Simpan & Terapkan Avatar</span>
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
