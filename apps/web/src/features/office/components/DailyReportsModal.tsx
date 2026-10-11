import { CalendarCheckIcon, XIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../../../lib/orpc.ts";

type TDailyReportsModalProps = {
	isOpen: boolean;
	workspaceId: string;
	onClose: () => void;
};

export function DailyReportsModal({
	isOpen,
	workspaceId,
	onClose,
}: TDailyReportsModalProps) {
	const reportsQuery = useQuery({
		...orpc.attendance.reports.queryOptions({
			input: { workspaceId, limit: 10 },
		}),
		enabled: isOpen,
	});

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
			{/* Double-Bezel Hardware Architecture */}
			<div className="relative w-full max-w-lg p-2 rounded-4xl bg-white/3 border border-white/10 backdrop-blur-3xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-slate-100 max-h-[85vh]">
				<div className="p-6 rounded-[1.5rem] bg-[#0b0f19]/95 border border-white/6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col max-h-[calc(85vh-1rem)]">
					<div className="flex items-center justify-between pb-4 border-b border-white/8">
						<div className="flex items-center gap-2">
							<div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
								<CalendarCheckIcon size={18} />
							</div>
							<h2 className="text-base font-semibold text-white tracking-tight">
								Recent Daily Reports
							</h2>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/8 transition cursor-pointer"
						>
							<XIcon size={18} />
						</button>
					</div>

					<div className="mt-4 overflow-y-auto space-y-3 pr-1">
						{reportsQuery.isLoading && (
							<div className="space-y-3 py-2">
								<div className="h-16 rounded-xl bg-white/4 animate-pulse" />
								<div className="h-16 rounded-xl bg-white/4 animate-pulse" />
							</div>
						)}

						{reportsQuery.isSuccess && reportsQuery.data.length === 0 && (
							<p className="text-xs text-slate-500 text-center py-8 font-mono">
								No reports submitted yet today.
							</p>
						)}

						{reportsQuery.isSuccess &&
							reportsQuery.data.map((report) => (
								<div
									key={report.id}
									className="p-3.5 rounded-2xl bg-black/40 border border-white/7 shadow-inner space-y-1.5"
								>
									<div className="flex items-center justify-between text-xs">
										<span className="font-semibold text-white">
											{report.userName}
										</span>
										<span className="text-[10px] font-mono text-slate-400">
											{new Date(report.createdAt).toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</div>
									<ul className="text-xs text-slate-300 space-y-0.5 list-disc list-inside">
										{report.points.map((pt: string, i: number) => (
											<li key={`${report.id}-pt-${i}`}>{pt}</li>
										))}
									</ul>
								</div>
							))}
					</div>
				</div>
			</div>
		</div>
	);
}
