import {
	ChatCircleDotsIcon,
	PaperPlaneRightIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

const QUICK_PRESETS = [
	"👋 Halo tim!",
	"☕ Coffee break",
	"🎯 Deep focus",
	"🚀 Ready to sync",
	"👍 Siap!",
] as const;

type TChatInputBarProps = {
	isOpen: boolean;
	onClose: () => void;
	onSendChat: (text: string) => void;
};

export function ChatInputBar({
	isOpen,
	onClose,
	onSendChat,
}: TChatInputBarProps) {
	const [text, setText] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			inputRef.current?.focus();
		} else {
			setText("");
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const handleSend = (content?: string) => {
		const messageToSend = (content ?? text).trim();
		if (!messageToSend) return;
		onSendChat(messageToSend);
		setText("");
		onClose();
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleSend();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			onClose();
		}
	};

	return (
		<div className="fixed bottom-22 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 animate-fade-in pointer-events-auto">
			{/* Quick Chips in Glass Pill */}
			<div className="p-1 rounded-full bg-white/3 border border-white/7 backdrop-blur-xl shadow-lg">
				<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0b0f19]/80">
					{QUICK_PRESETS.map((preset) => (
						<button
							key={preset}
							type="button"
							onClick={() => handleSend(preset)}
							className="px-2.5 py-0.5 rounded-full bg-white/4 hover:bg-white/9 border border-white/6 text-[10px] font-mono text-slate-300 hover:text-white transition active:scale-95 cursor-pointer whitespace-nowrap"
						>
							{preset}
						</button>
					))}
				</div>
			</div>

			{/* Main Input Double-Bezel Hardware Pill */}
			<div className="p-1.5 rounded-full bg-white/4 border border-white/8 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
				<form
					onSubmit={handleSubmit}
					className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0b0f19]/95 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] w-90 sm:w-110"
				>
					<div className="text-emerald-400 pl-1 shrink-0">
						<ChatCircleDotsIcon size={18} weight="bold" />
					</div>

					<input
						ref={inputRef}
						type="text"
						value={text}
						onChange={(e) => setText(e.target.value)}
						onKeyDown={handleKeyDown}
						maxLength={100}
						placeholder="Ketik bubble chat... (Enter untuk kirim)"
						className="w-full bg-transparent border-none text-xs font-medium text-white placeholder-slate-500 focus:outline-none"
					/>

					<span className="text-[10px] font-mono text-slate-500 shrink-0 select-none">
						{text.length}/100
					</span>

					<button
						type="submit"
						disabled={!text.trim()}
						className="p-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 shadow-[0_0_16px_rgba(16,185,129,0.35)] transition active:scale-95 cursor-pointer shrink-0"
						title="Kirim pesan"
					>
						<PaperPlaneRightIcon size={13} weight="bold" />
					</button>

					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/8 transition cursor-pointer shrink-0"
						title="Tutup (Esc)"
					>
						<XIcon size={14} />
					</button>
				</form>
			</div>
		</div>
	);
}
