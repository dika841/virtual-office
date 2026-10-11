import { BellSlashIcon, HeadphonesIcon } from "@phosphor-icons/react";

type TFocusBannerProps = {
	isVisible: boolean;
};

export function FocusBanner({ isVisible }: TFocusBannerProps) {
	if (!isVisible) return null;

	return (
		<div className="absolute top-18 left-1/2 -translate-x-1/2 z-20 p-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 backdrop-blur-2xl shadow-[0_8px_32px_rgba(99,102,241,0.25)] animate-fade-in pointer-events-none">
			<div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b0f19]/90 border border-indigo-500/30 text-xs text-indigo-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
				<HeadphonesIcon size={15} weight="bold" className="text-indigo-400" />
				<BellSlashIcon size={14} className="text-indigo-400" />
				<span>
					Deep Focus Active: Notifikasi dan Spatial Audio Dinonaktifkan
				</span>
			</div>
		</div>
	);
}
