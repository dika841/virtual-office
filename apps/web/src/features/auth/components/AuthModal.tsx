import {
	CheckIcon,
	EnvelopeSimpleIcon,
	LockSimpleIcon,
	SignInIcon,
	SpinnerGapIcon,
	UserIcon,
	UserPlusIcon,
	WarningCircleIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { signIn, signUp } from "../../../libs/auth/index.ts";
import { CHARACTER_PRESETS } from "../../office/components/CharacterSelectModal.tsx";

type TAuthModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
};

export function AuthModal({ isOpen, onClose, onSuccess }: TAuthModalProps) {
	const [mode, setMode] = useState<"signin" | "signup">("signin");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [selectedCharId, setSelectedCharId] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	if (!isOpen) return null;

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMessage(null);
		setIsLoading(true);

		try {
			const res = await signIn.email({
				email: email.trim(),
				password,
			});

			if (res.error) {
				setErrorMessage(
					res.error.message ||
						"Gagal masuk. Periksa kembali email dan kata sandi.",
				);
			} else {
				onSuccess?.();
				onClose();
			}
		} catch (err) {
			setErrorMessage(
				err instanceof Error ? err.message : "Terjadi kesalahan saat masuk.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMessage(null);
		setIsLoading(true);

		try {
			const res = await signUp.email({
				email: email.trim(),
				password,
				name: name.trim(),
				avatarSpriteId: `char_${selectedCharId}`,
				characterId: selectedCharId,
			} as Parameters<typeof signUp.email>[0]);

			if (res.error) {
				setErrorMessage(
					res.error.message || "Gagal mendaftar. Silakan coba kembali.",
				);
			} else {
				localStorage.setItem(
					"virtual_office_active_char",
					JSON.stringify({
						name: name.trim(),
						characterId: selectedCharId,
					}),
				);
				onSuccess?.();
				onClose();
			}
		} catch (err) {
			setErrorMessage(
				err instanceof Error
					? err.message
					: "Terjadi kesalahan saat mendaftar.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const currentPreset =
		CHARACTER_PRESETS.find((p) => p.id === selectedCharId) ||
		CHARACTER_PRESETS[0];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
			{/* Double-Bezel Hardware Architecture */}
			<div className="relative w-full max-w-md p-2 rounded-4xl bg-white/3 border border-white/10 backdrop-blur-3xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-slate-100">
				<div className="p-6 rounded-[1.5rem] bg-[#0b0f19]/95 border border-white/6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col max-h-[90vh]">
					{/* Modal Top Bar */}
					<div className="flex items-center justify-between pb-4 border-b border-white/8">
						<div className="flex items-center gap-2.5">
							<div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
								{mode === "signin" ? (
									<SignInIcon size={18} weight="bold" />
								) : (
									<UserPlusIcon size={18} weight="bold" />
								)}
							</div>
							<div>
								<h2 className="text-base font-semibold text-white tracking-tight">
									{mode === "signin"
										? "Masuk ke Virtual Office"
										: "Buat Akun Tim Baru"}
								</h2>
								<p className="text-xs text-slate-400">
									{mode === "signin"
										? "Akses workstation dan simpan laporan harian Anda."
										: "Pilih avatar 8-bit dan mulailah berkolaborasi."}
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

					{/* Tab Selector */}
					<div className="grid grid-cols-2 p-1 mt-4 rounded-xl bg-black/40 border border-white/7">
						<button
							type="button"
							onClick={() => {
								setMode("signin");
								setErrorMessage(null);
							}}
							className={`py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
								mode === "signin"
									? "bg-white/10 text-white border border-white/10 shadow-sm"
									: "text-slate-400 hover:text-slate-200"
							}`}
						>
							Masuk
						</button>
						<button
							type="button"
							onClick={() => {
								setMode("signup");
								setErrorMessage(null);
							}}
							className={`py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
								mode === "signup"
									? "bg-white/10 text-white border border-white/10 shadow-sm"
									: "text-slate-400 hover:text-slate-200"
							}`}
						>
							Daftar
						</button>
					</div>

					{/* Error Alert */}
					{errorMessage && (
						<div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
							<WarningCircleIcon
								size={16}
								className="shrink-0 mt-0.5 text-rose-400"
							/>
							<span className="leading-snug">{errorMessage}</span>
						</div>
					)}

					{/* Form Section */}
					<form
						onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
						className="mt-4 space-y-4 overflow-y-auto pr-1"
					>
						{mode === "signup" && (
							<div className="space-y-1.5">
								<label
									htmlFor="auth-name"
									className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5"
								>
									<UserIcon size={13} />
									<span>Nama Lengkap</span>
								</label>
								<input
									id="auth-name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
									maxLength={32}
									placeholder="mis. Randika Surya"
									className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/40 shadow-inner transition"
								/>
							</div>
						)}

						<div className="space-y-1.5">
							<label
								htmlFor="auth-email"
								className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5"
							>
								<EnvelopeSimpleIcon size={13} />
								<span>Alamat Email</span>
							</label>
							<input
								id="auth-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								placeholder="nama@perusahaan.com"
								className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/40 shadow-inner transition"
							/>
						</div>

						<div className="space-y-1.5">
							<label
								htmlFor="auth-password"
								className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5"
							>
								<LockSimpleIcon size={13} />
								<span>Kata Sandi</span>
							</label>
							<input
								id="auth-password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={6}
								placeholder="Minimal 6 karakter"
								className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/40 shadow-inner transition"
							/>
						</div>

						{/* Registration: Character Selection Picker */}
						{mode === "signup" && (
							<div className="space-y-2 pt-1">
								<div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
									<span>Pilih Avatar 8-Bit Awal</span>
									<span className="text-emerald-400 font-semibold lowercase">
										{currentPreset.name}
									</span>
								</div>

								<div className="grid grid-cols-6 gap-2">
									{CHARACTER_PRESETS.map((preset) => {
										const isSelected = selectedCharId === preset.id;
										return (
											<button
												key={preset.id}
												type="button"
												onClick={() => setSelectedCharId(preset.id)}
												className={`relative p-1 rounded-xl border flex flex-col items-center transition cursor-pointer active:scale-95 ${
													isSelected
														? "bg-emerald-950/40 border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
														: "bg-black/30 border-white/8 hover:border-white/20"
												}`}
												title={preset.name}
											>
												<div className="w-10 h-10 flex items-center justify-center p-0.5">
													<img
														src={preset.src}
														alt={preset.name}
														className="w-full h-full object-contain [image-rendering:pixelated]"
													/>
												</div>
												{isSelected && (
													<div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
														<CheckIcon size={8} weight="bold" />
													</div>
												)}
											</button>
										);
									})}
								</div>
							</div>
						)}

						{/* Action Button */}
						<div className="pt-2">
							<button
								type="submit"
								disabled={isLoading}
								className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs tracking-wide transition-all duration-200 active:scale-[0.98] shadow-[0_0_24px_rgba(16,185,129,0.35)] cursor-pointer"
							>
								{isLoading ? (
									<>
										<SpinnerGapIcon size={16} className="animate-spin" />
										<span>Memproses...</span>
									</>
								) : mode === "signin" ? (
									<>
										<SignInIcon size={16} weight="bold" />
										<span>Masuk Sekarang</span>
									</>
								) : (
									<>
										<UserPlusIcon size={16} weight="bold" />
										<span>Daftar Akun Baru</span>
									</>
								)}
							</button>
						</div>

						{/* Footer Note */}
						<p className="text-center text-[11px] text-slate-500">
							{mode === "signin"
								? "Belum punya akun? Beralih ke tab Daftar."
								: "Sudah punya akun tim? Beralih ke tab Masuk."}
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}
