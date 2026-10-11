import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AuthModal } from "../features/auth/components/AuthModal.tsx";
import { CharacterSelectModal } from "../features/office/components/CharacterSelectModal.tsx";
import { ChatInputBar } from "../features/office/components/ChatInputBar.tsx";
import { ClockOutModal } from "../features/office/components/ClockOutModal.tsx";
import { DailyReportsModal } from "../features/office/components/DailyReportsModal.tsx";
import { DockBar } from "../features/office/components/DockBar.tsx";
import { FocusBanner } from "../features/office/components/FocusBanner.tsx";
import { MembersDrawer } from "../features/office/components/MembersDrawer.tsx";
import {
	OFFICE_DESKS,
	OfficeCanvas,
} from "../features/office/components/OfficeCanvas.tsx";
import { OfficeHeader } from "../features/office/components/OfficeHeader.tsx";
import { useAttendance } from "../features/office/hooks/useAttendance.ts";
import { useUserIdentity } from "../features/office/hooks/useUserIdentity.ts";
import { useOfficePresence } from "../features/presence/hooks/useOfficePresence.ts";
import { useSpatialAudio } from "../features/presence/hooks/useSpatialAudio.ts";
import { signOut } from "../libs/auth/index.ts";

export const Route = createFileRoute("/")({
	component: IndexPage,
});

const WORKSPACE_ID = "wsp_main";

function IndexPage() {
	const { user, isAuthenticated, updateIdentity } = useUserIdentity();
	const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);
	const [isMembersDrawerOpen, setIsMembersDrawerOpen] = useState(false);
	const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
	const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [isChatOpen, setIsChatOpen] = useState(false);

	const initialDeskCoords = useMemo(() => {
		const desk = OFFICE_DESKS[0];
		return { x: desk?.seatX ?? 165, y: desk?.seatY ?? 235 };
	}, []);

	const {
		userPos,
		peers,
		socketStatus,
		chatBubbles,
		move,
		setPresenceState,
		setCharacter,
		sendSignal,
		sendChat,
		registerSignalHandler,
	} = useOfficePresence({
		workspaceId: WORKSPACE_ID,
		userId: user.id,
		characterId: user.characterId,
		initialX: initialDeskCoords.x,
		initialY: initialDeskCoords.y,
	});

	const {
		isClockedIn,
		currentState,
		assignedDeskId,
		isLoading: isAttendanceLoading,
		clockIn,
		clockOut,
		changeState,
		selectDesk,
	} = useAttendance({
		workspaceId: WORKSPACE_ID,
		userId: user.id,
		userName: user.name,
		onMove: move,
		onBroadcastState: setPresenceState,
	});

	// P2P WebRTC Proximity Spatial Audio
	const {
		isMicEnabled,
		isSpeaking,
		inRangeCount,
		peersAudioStatus,
		toggleMic,
	} = useSpatialAudio({
		userId: user.id,
		userPos,
		userState: currentState,
		peers,
		sendSignal,
		registerSignalHandler,
	});

	// Global shortcut: Press Enter to open Bubble Chat
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Enter" && !isChatOpen) {
				const activeTag = document.activeElement?.tagName.toLowerCase();
				if (activeTag !== "input" && activeTag !== "textarea") {
					e.preventDefault();
					setIsChatOpen(true);
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isChatOpen]);

	const handleClockOut = async (report: {
		points: string[];
		taskLinks: string[];
	}) => {
		await clockOut(report);
		setIsClockOutModalOpen(false);
	};

	const handleSaveIdentity = (updates: {
		name: string;
		characterId: number;
	}) => {
		updateIdentity(updates);
		setCharacter(updates.characterId);
	};

	const handleSignOut = async () => {
		await signOut();
	};

	const totalOnline = peers.length + 1;

	return (
		<main className="relative min-h-dvh w-full overflow-hidden bg-[#05070f] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.05),rgba(255,255,255,0))] font-sans select-none">
			<OfficeHeader
				isClockedIn={isClockedIn}
				currentState={currentState}
				socketStatus={socketStatus}
				totalOnline={totalOnline}
				currentUser={{
					name: user.name,
					characterId: user.characterId,
				}}
				isAuthenticated={isAuthenticated}
				voiceInfo={{
					isMicEnabled,
					inRangeCount,
				}}
				onOpenReports={() => setIsReportsModalOpen(true)}
				onOpenMembers={() => setIsMembersDrawerOpen(true)}
				onOpenCharacterSelect={() => setIsCharacterModalOpen(true)}
				onOpenAuthModal={() => setIsAuthModalOpen(true)}
				onSignOut={handleSignOut}
			/>

			<FocusBanner isVisible={isClockedIn && currentState === "focus"} />

			<OfficeCanvas
				peers={peers}
				currentUser={{
					id: user.id,
					name: user.name,
					characterId: user.characterId,
					x: userPos.x,
					y: userPos.y,
					state: currentState,
				}}
				assignedDeskId={assignedDeskId}
				isMicEnabled={isMicEnabled}
				peersAudioStatus={peersAudioStatus}
				chatBubbles={chatBubbles}
				onMove={move}
				onSelectDesk={selectDesk}
			/>

			<ChatInputBar
				isOpen={isChatOpen}
				onClose={() => setIsChatOpen(false)}
				onSendChat={sendChat}
			/>

			<DockBar
				state={currentState}
				isClockedIn={isClockedIn}
				isLoading={isAttendanceLoading}
				isMicEnabled={isMicEnabled}
				isSpeaking={isSpeaking}
				isChatOpen={isChatOpen}
				onClockIn={clockIn}
				onClockOutPrompt={() => setIsClockOutModalOpen(true)}
				onSetState={changeState}
				onToggleMic={toggleMic}
				onToggleChat={() => setIsChatOpen((prev) => !prev)}
			/>

			<ClockOutModal
				isOpen={isClockOutModalOpen}
				isSubmitting={isAttendanceLoading}
				onClose={() => setIsClockOutModalOpen(false)}
				onSubmit={handleClockOut}
			/>

			<MembersDrawer
				isOpen={isMembersDrawerOpen}
				onClose={() => setIsMembersDrawerOpen(false)}
				currentUser={{
					id: user.id,
					name: user.name,
					characterId: user.characterId,
					state: currentState,
				}}
				assignedDeskId={assignedDeskId}
				peers={peers}
				isAuthenticated={isAuthenticated}
				onOpenCharacterSelect={() => setIsCharacterModalOpen(true)}
				onOpenAuthModal={() => setIsAuthModalOpen(true)}
			/>

			<DailyReportsModal
				isOpen={isReportsModalOpen}
				workspaceId={WORKSPACE_ID}
				onClose={() => setIsReportsModalOpen(false)}
			/>

			<CharacterSelectModal
				isOpen={isCharacterModalOpen}
				currentName={user.name}
				currentCharacterId={user.characterId}
				onClose={() => setIsCharacterModalOpen(false)}
				onSave={handleSaveIdentity}
			/>

			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
		</main>
	);
}
