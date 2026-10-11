import {
	SPATIAL_AUDIO_MAX_DISTANCE,
	SPATIAL_AUDIO_MIN_DISTANCE,
	type TPresenceEvent,
	type TPresenceState,
} from "@virtual-office/schemas";
import { useCallback, useEffect, useRef, useState } from "react";

const RTC_CONFIG: RTCConfiguration = {
	iceServers: [
		{ urls: "stun:stun.l.google.com:19302" },
		{ urls: "stun:stun1.l.google.com:19302" },
	],
};

type TPeerAudioNode = {
	pc: RTCPeerConnection;
	gain: GainNode;
	panner?: StereoPannerNode;
	stream?: MediaStream;
};

type TUseSpatialAudioOptions = {
	userId: string;
	userPos: { x: number; y: number };
	userState: TPresenceState;
	peers: TPresenceEvent[];
	sendSignal: (targetUserId: string, signal: unknown) => void;
	registerSignalHandler: (
		handler: (senderUserId: string, signal: unknown) => void,
	) => () => void;
};

export type TPeerAudioStatus = {
	inRange: boolean;
	distance: number;
	volume: number;
};

export function useSpatialAudio({
	userId,
	userPos,
	userState,
	peers,
	sendSignal,
	registerSignalHandler,
}: TUseSpatialAudioOptions) {
	const [isMicEnabled, setIsMicEnabled] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [peersAudioStatus, setPeersAudioStatus] = useState<
		Map<string, TPeerAudioStatus>
	>(new Map());

	const audioContextRef = useRef<AudioContext | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const peerNodesRef = useRef<Map<string, TPeerAudioNode>>(new Map());
	const analyserRef = useRef<AnalyserNode | null>(null);
	const animFrameRef = useRef<number | null>(null);

	// Initialize AudioContext lazily
	const getAudioContext = useCallback(() => {
		if (!audioContextRef.current) {
			const AudioContextClass =
				window.AudioContext ||
				(
					window as unknown as {
						webkitAudioContext: typeof AudioContext;
					}
				).webkitAudioContext;
			audioContextRef.current = new AudioContextClass();
		}
		if (audioContextRef.current.state === "suspended") {
			audioContextRef.current.resume();
		}
		return audioContextRef.current;
	}, []);

	// Speaking detector using Web Audio Analyser
	const setupVoiceActivityDetection = useCallback(
		(stream: MediaStream) => {
			const audioCtx = getAudioContext();
			const source = audioCtx.createMediaStreamSource(stream);
			const analyser = audioCtx.createAnalyser();
			analyser.fftSize = 256;
			source.connect(analyser);
			analyserRef.current = analyser;

			const dataArray = new Uint8Array(analyser.frequencyBinCount);

			const checkSpeaking = () => {
				analyser.getByteFrequencyData(dataArray);
				let sum = 0;
				for (let i = 0; i < dataArray.length; i++) {
					const val = dataArray[i];
					if (val) sum += val;
				}
				const average = sum / dataArray.length;
				setIsSpeaking(average > 15);
				animFrameRef.current = requestAnimationFrame(checkSpeaking);
			};

			checkSpeaking();
		},
		[getAudioContext],
	);

	// Toggle local microphone
	const toggleMic = useCallback(async () => {
		if (isMicEnabled) {
			// Disable mic
			for (const track of localStreamRef.current?.getTracks() ?? []) {
				track.stop();
			}
			localStreamRef.current = null;
			setIsMicEnabled(false);
			setIsSpeaking(false);
			if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

			// Remove local tracks from peer connections
			for (const { pc } of peerNodesRef.current.values()) {
				for (const sender of pc.getSenders()) {
					if (sender.track) pc.removeTrack(sender);
				}
			}
		} else {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: {
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true,
					},
				});
				localStreamRef.current = stream;
				setIsMicEnabled(true);
				getAudioContext();
				setupVoiceActivityDetection(stream);

				// Add audio track to existing peer connections
				const audioTrack = stream.getAudioTracks()[0];
				if (audioTrack) {
					for (const { pc } of peerNodesRef.current.values()) {
						pc.addTrack(audioTrack, stream);
					}
				}
			} catch (err) {
				console.error("Microphone permission denied or not available:", err);
			}
		}
	}, [isMicEnabled, getAudioContext, setupVoiceActivityDetection]);

	// Create or get RTCPeerConnection for a remote peer
	const getOrCreatePeerConnection = useCallback(
		(peerId: string): RTCPeerConnection => {
			let node = peerNodesRef.current.get(peerId);
			if (node) return node.pc;

			const pc = new RTCPeerConnection(RTC_CONFIG);
			const audioCtx = getAudioContext();

			const gain = audioCtx.createGain();
			gain.gain.value = 0; // Starts silent until distance is checked

			let panner: StereoPannerNode | undefined;
			if (audioCtx.createStereoPanner) {
				panner = audioCtx.createStereoPanner();
				panner.connect(gain);
				gain.connect(audioCtx.destination);
			} else {
				gain.connect(audioCtx.destination);
			}

			// Add local tracks if mic is active
			if (localStreamRef.current) {
				const audioTrack = localStreamRef.current.getAudioTracks()[0];
				if (audioTrack) {
					pc.addTrack(audioTrack, localStreamRef.current);
				}
			}

			pc.onicecandidate = (event) => {
				if (event.candidate) {
					sendSignal(peerId, { candidate: event.candidate });
				}
			};

			pc.ontrack = (event) => {
				const stream = event.streams[0];
				if (stream) {
					const source = audioCtx.createMediaStreamSource(stream);
					if (panner) {
						source.connect(panner);
					} else {
						source.connect(gain);
					}
				}
			};

			node = { pc, gain, panner };
			peerNodesRef.current.set(peerId, node);

			return pc;
		},
		[getAudioContext, sendSignal],
	);

	// Handle WebRTC signaling exchange
	useEffect(() => {
		const cleanup = registerSignalHandler(async (senderUserId, rawSignal) => {
			if (!rawSignal || typeof rawSignal !== "object") return;
			const pc = getOrCreatePeerConnection(senderUserId);

			const signal = rawSignal as {
				type?: string;
				sdp?: string;
				candidate?: RTCIceCandidateInit;
			};

			if (signal.type === "offer" && signal.sdp) {
				await pc.setRemoteDescription(
					new RTCSessionDescription({ type: "offer", sdp: signal.sdp }),
				);
				const answer = await pc.createAnswer();
				await pc.setLocalDescription(answer);
				sendSignal(senderUserId, { type: "answer", sdp: answer.sdp });
			} else if (signal.type === "answer" && signal.sdp) {
				await pc.setRemoteDescription(
					new RTCSessionDescription({ type: "answer", sdp: signal.sdp }),
				);
			} else if (signal.candidate) {
				try {
					await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
				} catch (e) {
					console.warn("Failed to add ICE candidate:", e);
				}
			}
		});

		return cleanup;
	}, [registerSignalHandler, getOrCreatePeerConnection, sendSignal]);

	// Maintain peer connections and initiate calls (polite caller pattern: userId < peerId)
	useEffect(() => {
		const activePeerIds = new Set(peers.map((p) => p.userId));

		// Clean up left peers
		for (const [peerId, node] of peerNodesRef.current.entries()) {
			if (!activePeerIds.has(peerId)) {
				node.pc.close();
				node.gain.disconnect();
				node.panner?.disconnect();
				peerNodesRef.current.delete(peerId);
			}
		}

		// Connect with new peers
		for (const peer of peers) {
			if (!peerNodesRef.current.has(peer.userId)) {
				const pc = getOrCreatePeerConnection(peer.userId);

				// User with alphabetically smaller ID initiates the offer
				if (userId < peer.userId) {
					pc.createOffer()
						.then(async (offer) => {
							await pc.setLocalDescription(offer);
							sendSignal(peer.userId, { type: "offer", sdp: offer.sdp });
						})
						.catch((err) => console.error("Error creating WebRTC offer:", err));
				}
			}
		}
	}, [peers, userId, getOrCreatePeerConnection, sendSignal]);

	// Realtime Spatial Audio calculation based on 2D coordinates
	useEffect(() => {
		const audioCtx = audioContextRef.current;
		const statusMap = new Map<string, TPeerAudioStatus>();

		for (const peer of peers) {
			const node = peerNodesRef.current.get(peer.userId);
			const dx = peer.x - userPos.x;
			const dy = peer.y - userPos.y;
			const distance = Math.hypot(dx, dy);

			let targetVolume = 0;
			const isDeepFocus = userState === "focus" || peer.state === "focus";

			if (isDeepFocus || distance >= SPATIAL_AUDIO_MAX_DISTANCE) {
				targetVolume = 0;
			} else if (distance <= SPATIAL_AUDIO_MIN_DISTANCE) {
				targetVolume = 1;
			} else {
				targetVolume =
					1 -
					(distance - SPATIAL_AUDIO_MIN_DISTANCE) /
						(SPATIAL_AUDIO_MAX_DISTANCE - SPATIAL_AUDIO_MIN_DISTANCE);
			}

			const inRange = !isDeepFocus && distance < SPATIAL_AUDIO_MAX_DISTANCE;

			statusMap.set(peer.userId, {
				inRange,
				distance: Math.round(distance),
				volume: Math.round(targetVolume * 100),
			});

			// Smooth Web Audio Gain Adjustment
			if (node && audioCtx && audioCtx.state === "running") {
				node.gain.gain.setTargetAtTime(
					targetVolume,
					audioCtx.currentTime,
					0.05,
				);

				if (node.panner) {
					const pan = Math.min(
						1,
						Math.max(-1, dx / SPATIAL_AUDIO_MAX_DISTANCE),
					);
					node.panner.pan.setTargetAtTime(pan, audioCtx.currentTime, 0.05);
				}
			}
		}

		setPeersAudioStatus(statusMap);
	}, [userPos, userState, peers]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
			for (const t of localStreamRef.current?.getTracks() ?? []) {
				t.stop();
			}
			for (const node of peerNodesRef.current.values()) {
				node.pc.close();
				node.gain.disconnect();
				node.panner?.disconnect();
			}
			peerNodesRef.current.clear();
			audioContextRef.current?.close();
			audioContextRef.current = null;
		};
	}, []);

	const inRangeCount = Array.from(peersAudioStatus.values()).filter(
		(s) => s.inRange,
	).length;

	return {
		isMicEnabled,
		isSpeaking,
		inRangeCount,
		peersAudioStatus,
		toggleMic,
	};
}
