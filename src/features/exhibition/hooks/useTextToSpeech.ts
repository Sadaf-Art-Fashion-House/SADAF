/**
 * SADAF | Exhibition — useTextToSpeech Hook
 *
 * Wraps the browser's SpeechSynthesis API (Web Speech) so the
 * curatorial tour narration is spoken aloud rather than just shown
 * as animated text.
 *
 * The Web Speech API is built into every modern browser (Chrome,
 * Firefox, Safari, Edge) — no API key, no backend, no cost.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface TtsState {
    isSpeaking: boolean;
    isPaused: boolean;
    currentWordIndex: number;
}

const DEFAULT_RATE = 0.85; // Slightly slower for a museum-guide feel
const DEFAULT_PITCH = 1.0;
const DEFAULT_VOICE_HINT = 'en-US';

/**
 * React hook that manages the browser SpeechSynthesis lifecycle.
 *
 * @example
 *   const { isSpeaking, speak, stop, pause, resume } = useTextToSpeech();
 *   speak("Hello, welcome to the museum.");
 *   stop();
 */
export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const wordCountRef = useRef(0);

    /** Cancel any ongoing speech and clean up. */
    const cancelSpeech = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentWordIndex(0);
        utteranceRef.current = null;
    }, []);

    /** Speak the given text aloud. Automatically cancels any previous utterance. */
    const speak = useCallback((text: string, rate = DEFAULT_RATE, pitch = DEFAULT_PITCH) => {
        // Cancel anything currently playing
        window.speechSynthesis.cancel();

        if (!text.trim()) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = DEFAULT_VOICE_HINT;
        utterance.rate = rate;
        utterance.pitch = pitch;

        const wordCount = text.split(/\s+/).length;
        wordCountRef.current = wordCount;

        utterance.onstart = () => {
            setIsSpeaking(true);
            setIsPaused(false);
            setCurrentWordIndex(0);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
            setCurrentWordIndex(wordCount);
            utteranceRef.current = null;
        };

        utterance.onerror = (event) => {
            // Ignore 'canceled' errors — they're expected when stopping
            if (event.error === 'canceled' || event.error === 'interrupted') return;
            console.error('SpeechSynthesis error:', event.error);
            setIsSpeaking(false);
            setIsPaused(false);
            utteranceRef.current = null;
        };

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                setCurrentWordIndex((prev) => Math.min(prev + 1, wordCount));
            }
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, []);

    /** Pause the current utterance. */
    const pause = useCallback(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    }, []);

    /** Resume a paused utterance. */
    const resume = useCallback(() => {
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        }
    }, []);

    /** Toggle play/pause. */
    const toggle = useCallback(() => {
        if (isPaused) {
            resume();
        } else if (isSpeaking) {
            pause();
        }
    }, [isPaused, isSpeaking, pause, resume]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    return {
        isSpeaking,
        isPaused,
        currentWordIndex,
        speak,
        stop: cancelSpeech,
        pause,
        resume,
        toggle,
    };
}
