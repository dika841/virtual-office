import { useMutation, useQuery } from "@tanstack/react-query";
import type { TPresenceState } from "@virtual-office/schemas";
import { useCallback, useEffect, useState } from "react";
import { orpc } from "../../../lib/orpc.ts";
import {
	FOCUS_COORDINATES,
	OFFICE_DESKS,
	PANTRY_COORDINATES,
} from "../components/OfficeCanvas.tsx";

const EXIT_COORDINATES = { x: 685, y: 730 };

type TUseAttendanceOptions = {
	workspaceId: string;
	userId: string;
	userName: string;
	onMove: (x: number, y: number) => void;
	onBroadcastState: (state: TPresenceState) => void;
};

export function useAttendance({
	workspaceId,
	userId,
	userName,
	onMove,
	onBroadcastState,
}: TUseAttendanceOptions) {
	const [isClockedIn, setIsClockedIn] = useState(false);
	const [activeAttendanceId, setActiveAttendanceId] = useState<string | null>(
		null,
	);
	const [currentState, setCurrentState] = useState<TPresenceState>("idle");
	const [assignedDeskId, setAssignedDeskId] = useState("desk_1");

	const statusQuery = useQuery(
		orpc.attendance.status.queryOptions({
			input: {
				workspaceId,
				userId,
			},
		}),
	);

	const clockInMutation = useMutation(
		orpc.attendance.clockIn.mutationOptions(),
	);
	const clockOutMutation = useMutation(
		orpc.attendance.clockOut.mutationOptions(),
	);

	// Sync initial status from DB
	useEffect(() => {
		if (!statusQuery.data) return;

		if (statusQuery.data.isClockedIn && statusQuery.data.activeSession) {
			setIsClockedIn(true);
			setActiveAttendanceId(statusQuery.data.activeSession.id);
			setCurrentState("working");
		}

		if (statusQuery.data.assignedDeskId) {
			setAssignedDeskId(statusQuery.data.assignedDeskId);
			const desk = OFFICE_DESKS.find(
				(d) => d.id === statusQuery.data.assignedDeskId,
			);
			if (desk && !isClockedIn) {
				onMove(desk.seatX, desk.seatY);
			}
		}
	}, [statusQuery.data, isClockedIn, onMove]);

	const clockIn = useCallback(async () => {
		try {
			const res = await clockInMutation.mutateAsync({
				workspaceId,
				userId,
				userName,
				assignedDeskId,
			});

			setIsClockedIn(true);
			setActiveAttendanceId(res.attendanceId);
			setCurrentState("working");

			const desk =
				OFFICE_DESKS.find((d) => d.id === res.assignedDeskId) ??
				OFFICE_DESKS[0];
			if (desk) {
				onMove(desk.seatX, desk.seatY);
			}

			onBroadcastState("working");
		} catch (error) {
			console.error("Clock In failed:", error);
		}
	}, [
		clockInMutation,
		workspaceId,
		userId,
		userName,
		assignedDeskId,
		onMove,
		onBroadcastState,
	]);

	const clockOut = useCallback(
		async (report: { points: string[]; taskLinks: string[] }) => {
			if (!activeAttendanceId) return;

			try {
				await clockOutMutation.mutateAsync({
					workspaceId,
					attendanceId: activeAttendanceId,
					userId,
					report,
				});

				setIsClockedIn(false);
				setActiveAttendanceId(null);
				setCurrentState("idle");

				onMove(EXIT_COORDINATES.x, EXIT_COORDINATES.y);
				onBroadcastState("idle");

				statusQuery.refetch();
			} catch (error) {
				console.error("Clock Out failed:", error);
			}
		},
		[
			activeAttendanceId,
			clockOutMutation,
			workspaceId,
			userId,
			onMove,
			onBroadcastState,
			statusQuery,
		],
	);

	const changeState = useCallback(
		(nextState: TPresenceState) => {
			setCurrentState(nextState);
			onBroadcastState(nextState);

			if (nextState === "break") {
				onMove(PANTRY_COORDINATES.x, PANTRY_COORDINATES.y);
			} else if (nextState === "focus") {
				onMove(FOCUS_COORDINATES.x, FOCUS_COORDINATES.y);
			} else if (nextState === "working") {
				const desk =
					OFFICE_DESKS.find((d) => d.id === assignedDeskId) ?? OFFICE_DESKS[0];
				if (desk) {
					onMove(desk.seatX, desk.seatY);
				}
			}
		},
		[assignedDeskId, onMove, onBroadcastState],
	);

	const selectDesk = useCallback((deskId: string) => {
		setAssignedDeskId(deskId);
	}, []);

	return {
		isClockedIn,
		activeAttendanceId,
		currentState,
		assignedDeskId,
		isLoading: clockInMutation.isPending || clockOutMutation.isPending,
		clockIn,
		clockOut,
		changeState,
		selectDesk,
	};
}
