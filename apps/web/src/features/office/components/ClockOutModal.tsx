import { CheckIcon, CircleNotchIcon, XIcon } from "@phosphor-icons/react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import { parseReportFromEditor } from "../utils/report-parser.ts";
import { EditorToolbar } from "./EditorToolbar.tsx";

type TClockOutModalProps = {
	isOpen: boolean;
	isSubmitting?: boolean;
	onClose: () => void;
	onSubmit: (report: { points: string[]; taskLinks: string[] }) => void;
};

export function ClockOutModal({
	isOpen,
	isSubmitting = false,
	onClose,
	onSubmit,
}: TClockOutModalProps) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				bulletList: {
					keepMarks: true,
					keepAttributes: false,
				},
				orderedList: {
					keepMarks: true,
					keepAttributes: false,
				},
			}),
			Placeholder.configure({
				placeholder:
					"Tulis ringkasan pencapaian kerja Anda hari ini... Gunakan bullet list atau paragraf untuk setiap poin.",
			}),
			Link.configure({
				openOnClick: false,
				autolink: true,
				defaultProtocol: "https",
				HTMLAttributes: {
					class: "text-emerald-400 underline hover:text-emerald-300 transition",
				},
			}),
		],
		content: "",
		editorProps: {
			attributes: {
				class:
					"tiptap focus:outline-none min-h-[140px] max-h-[220px] overflow-y-auto px-4 py-3 text-xs text-slate-100 leading-relaxed font-sans",
			},
		},
	});

	// Reset editor state when opened
	useEffect(() => {
		if (isOpen && editor) {
			editor.commands.setContent("");
			setErrorMessage(null);
			setTimeout(() => {
				editor.commands.focus();
			}, 60);
		}
	}, [isOpen, editor]);

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!editor) return;

		const { points, taskLinks } = parseReportFromEditor(editor);

		if (points.length === 0) {
			setErrorMessage(
				"Tulis setidaknya satu poin pencapaian sebelum Clock Out.",
			);
			return;
		}

		setErrorMessage(null);
		onSubmit({ points, taskLinks });
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
			{/* Double-Bezel Hardware Architecture */}
			<div className="relative w-full max-w-lg p-2 rounded-4xl bg-white/3 border border-white/10 backdrop-blur-3xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-slate-100">
				<div className="p-6 rounded-[1.5rem] bg-[#0b0f19]/95 border border-white/6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
					{/* Header */}
					<div className="flex items-center justify-between pb-4 border-b border-white/8">
						<div>
							<h2 className="text-base font-semibold text-white tracking-tight">
								Daily Work Summary
							</h2>
							<p className="text-xs text-slate-400">
								Catat pencapaian yang Anda selesaikan hari ini sebelum Clock
								Out.
							</p>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/8 transition cursor-pointer"
						>
							<XIcon size={18} />
						</button>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="mt-4 space-y-4">
						<div className="space-y-1.5">
							<span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
								Ringkasan Pekerjaan
							</span>

							{/* Tiptap Container */}
							<div className="rounded-2xl bg-black/40 border border-white/10 overflow-hidden focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/40 shadow-inner transition">
								<EditorToolbar editor={editor} />
								<EditorContent editor={editor} />
							</div>

							{errorMessage && (
								<p className="text-[11px] text-rose-400 font-medium">
									{errorMessage}
								</p>
							)}

							<p className="text-[11px] text-slate-500">
								Tips: Setiap bullet point atau baris baru akan tersimpan
								otomatis sebagai poin pencapaian harian. Tautan PR / task juga
								akan otomatis terdeteksi.
							</p>
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
								disabled={isSubmitting}
								className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs tracking-wide transition-all active:scale-[0.98] shadow-[0_0_24px_rgba(244,63,94,0.35)] cursor-pointer"
							>
								{isSubmitting ? (
									<CircleNotchIcon size={14} className="animate-spin" />
								) : (
									<CheckIcon size={14} weight="bold" />
								)}
								<span>
									{isSubmitting ? "Menyimpan..." : "Simpan & Clock Out"}
								</span>
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
