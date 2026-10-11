import {
	ArrowClockwiseIcon,
	ArrowCounterClockwiseIcon,
	CodeIcon,
	LinkIcon,
	ListBulletsIcon,
	ListNumbersIcon,
	TextBIcon,
	TextItalicIcon,
	TextStrikethroughIcon,
} from "@phosphor-icons/react";
import type { Editor } from "@tiptap/react";
import { type FormEvent, useState } from "react";

type TEditorToolbarProps = {
	editor: Editor | null;
};

type TToolbarButton = {
	id: string;
	title: string;
	icon: React.ComponentType<{ size: number; weight?: "bold" | "regular" }>;
	weight?: "bold" | "regular";
	isActive: () => boolean;
	onClick: () => void;
	disabled?: () => boolean;
	hasDividerAfter?: boolean;
};

export function EditorToolbar({ editor }: TEditorToolbarProps) {
	const [showLinkInput, setShowLinkInput] = useState(false);
	const [linkInput, setLinkInput] = useState("");

	if (!editor) return null;

	const handleToggleLink = () => {
		if (editor.isActive("link")) {
			editor.chain().focus().unsetLink().run();
			setShowLinkInput(false);
			return;
		}
		setShowLinkInput((prev) => !prev);
	};

	const handleApplyLink = (e: FormEvent) => {
		e.preventDefault();
		const val = linkInput.trim();
		if (val) {
			const formatted = /^https?:\/\//i.test(val) ? val : `https://${val}`;
			editor
				.chain()
				.focus()
				.extendMarkRange("link")
				.setLink({ href: formatted })
				.run();
		}
		setLinkInput("");
		setShowLinkInput(false);
	};

	const buttons: TToolbarButton[] = [
		{
			id: "bold",
			title: "Bold (Ctrl+B)",
			icon: TextBIcon,
			weight: "bold",
			isActive: () => editor.isActive("bold"),
			onClick: () => editor.chain().focus().toggleBold().run(),
		},
		{
			id: "italic",
			title: "Italic (Ctrl+I)",
			icon: TextItalicIcon,
			weight: "bold",
			isActive: () => editor.isActive("italic"),
			onClick: () => editor.chain().focus().toggleItalic().run(),
		},
		{
			id: "strike",
			title: "Strikethrough",
			icon: TextStrikethroughIcon,
			isActive: () => editor.isActive("strike"),
			onClick: () => editor.chain().focus().toggleStrike().run(),
		},
		{
			id: "code",
			title: "Inline Code",
			icon: CodeIcon,
			isActive: () => editor.isActive("code"),
			onClick: () => editor.chain().focus().toggleCode().run(),
			hasDividerAfter: true,
		},
		{
			id: "bulletList",
			title: "Bullet List",
			icon: ListBulletsIcon,
			weight: "bold",
			isActive: () => editor.isActive("bulletList"),
			onClick: () => editor.chain().focus().toggleBulletList().run(),
		},
		{
			id: "orderedList",
			title: "Numbered List",
			icon: ListNumbersIcon,
			weight: "bold",
			isActive: () => editor.isActive("orderedList"),
			onClick: () => editor.chain().focus().toggleOrderedList().run(),
			hasDividerAfter: true,
		},
		{
			id: "link",
			title: "Insert/Edit Link",
			icon: LinkIcon,
			weight: "bold",
			isActive: () => editor.isActive("link"),
			onClick: handleToggleLink,
			hasDividerAfter: true,
		},
		{
			id: "undo",
			title: "Undo",
			icon: ArrowCounterClockwiseIcon,
			isActive: () => false,
			onClick: () => editor.chain().focus().undo().run(),
			disabled: () => !editor.can().undo(),
		},
		{
			id: "redo",
			title: "Redo",
			icon: ArrowClockwiseIcon,
			isActive: () => false,
			onClick: () => editor.chain().focus().redo().run(),
			disabled: () => !editor.can().redo(),
		},
	];

	return (
		<>
			<div className="flex flex-wrap items-center gap-1 p-2 bg-white/2 border-b border-white/6">
				{buttons.map((btn) => {
					const Icon = btn.icon;
					const active = btn.isActive();
					const disabled = btn.disabled ? btn.disabled() : false;

					return (
						<div key={btn.id} className="flex items-center">
							<button
								type="button"
								onClick={btn.onClick}
								disabled={disabled}
								title={btn.title}
								className={`p-1.5 rounded-lg text-xs transition cursor-pointer active:scale-95 ${
									active
										? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
										: "text-slate-400 hover:text-white hover:bg-white/6 border border-transparent"
								} ${disabled ? "opacity-30 pointer-events-none" : ""}`}
							>
								<Icon size={14} weight={btn.weight ?? "regular"} />
							</button>

							{btn.hasDividerAfter && (
								<div className="w-[1px] h-4 bg-white/10 mx-1" />
							)}
						</div>
					);
				})}
			</div>

			{showLinkInput && (
				<form
					onSubmit={handleApplyLink}
					className="flex items-center gap-2 p-2 bg-slate-900/90 border-b border-white/8 animate-fade-in"
				>
					<input
						type="url"
						placeholder="https://github.com/org/repo/pull/123"
						value={linkInput}
						onChange={(e) => setLinkInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Escape") {
								setShowLinkInput(false);
							}
						}}
						className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80"
					/>
					<button
						type="submit"
						className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-medium border border-emerald-500/30 cursor-pointer"
					>
						Terapkan
					</button>
					<button
						type="button"
						onClick={() => setShowLinkInput(false)}
						className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs cursor-pointer"
					>
						Batal
					</button>
				</form>
			)}
		</>
	);
}
