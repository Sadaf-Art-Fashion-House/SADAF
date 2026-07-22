/**
 * SADAF | Exhibition — useTextToSpeech Hook
 *
 * Wraps the browser's SpeechSynthesis API (Web Speech) so the
 * curatorial tour narration is spoken aloud rather than just shown
 * as animated text.
 *
 * The Web Speech API is built into every modern browser (Chrome,
 * Firefox, Safari, Edge) — no API key, no backend, no cost.
 *
 * Features:
 * - Speak / Stop / Pause / Resume
 * - Voice selection from available system voices
 * - Configurable rate (speed) and pitch
 * - Language-aware: auto-detects Arabic text and sets lang accordingly
 * - Word-by-word progress tracking for transcript sync
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface TtsOptions {
    rate: number;
    pitch: number;
    voiceUri: string | null;
    lang: string;
}

const DEFAULT_OPTIONS: TtsOptions = {
    rate: 0.85,
    pitch: 1.0,
    voiceUri: null,
    lang: 'en',
};

/** Detect if text contains Arabic characters (Unicode range 0600-06FF, 0750-077F, 08A0-08FF, FB50-FDFF, FE70-FEFF). */
function containsArabic(text: string): boolean {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(text);
}

/**
 * React hook that manages the browser SpeechSynthesis lifecycle.
 *
 * @example
 *   const { isSpeaking, voices, isArabicText, setLanguage, speak } = useTextToSpeech();
 *   speak("Hello, welcome to the museum.");
 *   setLanguage('ar');
 */
export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [options, setOptions] = useState<TtsOptions>(DEFAULT_OPTIONS);
    const [currentText, setCurrentText] = useState('');
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const wordCountRef = useRef(0);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const isArabicText = containsArabic(currentText);

    /** Load available voices from the browser. */
    const loadVoices = useCallback(() => {
        const available = window.speechSynthesis.getVoices();
        if (available.length > 0) {
            setVoices(available);
            // Auto-select first voice matching current language if none selected
            setOptions((prev) => {
                if (!prev.voiceUri) {
                    const targetLang = prev.lang;
                    const preferredVoice = available.find(
                        (v) => v.lang.startsWith(targetLang) && v.localService
                    );
                    return { ...prev, voiceUri: preferredVoice?.voiceURI || available[0]?.voiceURI || null };
                }
                return prev;
            });
        }
    }, []);

    // Load voices on mount and when they change (Chrome loads them async)
    useEffect(() => {
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        loadVoices();

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [loadVoices]);

    /** Cancel any ongoing speech and clean up. */
    const cancelSpeech = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentWordIndex(0);
        utteranceRef.current = null;
    }, []);

    /** Speak the given text aloud using current options. Automatically detects Arabic. */
    const speak = useCallback((text: string) => {
        window.speechSynthesis.cancel();
        if (!text.trim()) return;

        setCurrentText(text);

        const opts = optionsRef.current;
        const utterance = new SpeechSynthesisUtterance(text);

        // Auto-detect language from text content
        if (containsArabic(text)) {
            utterance.lang = 'ar-SA';
        } else {
            utterance.lang = 'en-US';
        }

        utterance.rate = opts.rate;
        utterance.pitch = opts.pitch;

        if (opts.voiceUri) {
            const matched = voices.find((v) => v.voiceURI === opts.voiceUri);
            if (matched) utterance.voice = matched;
        }

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
    }, [voices]);

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

    /** Select a voice by its URI. */
    const setVoice = useCallback((voiceUri: string) => {
        setOptions((prev) => ({ ...prev, voiceUri }));
    }, []);

    /** Adjust speech rate (0.1 – 2.0). */
    const setRate = useCallback((rate: number) => {
        setOptions((prev) => ({ ...prev, rate: Math.max(0.1, Math.min(2.0, rate)) }));
    }, []);

    /** Adjust speech pitch (0.1 – 2.0). */
    const setPitch = useCallback((pitch: number) => {
        setOptions((prev) => ({ ...prev, pitch: Math.max(0.1, Math.min(2.0, pitch)) }));
    }, []);

    /** Toggle between English and Arabic language mode. Auto-selects the first matching voice. */
    const setLanguage = useCallback((lang: 'en' | 'ar') => {
        const targetVoice = voices.find(
            (v) => v.lang.startsWith(lang) && v.localService
        );
        setOptions((prev) => ({
            ...prev,
            lang,
            voiceUri: targetVoice?.voiceURI || prev.voiceUri,
        }));
    }, [voices]);

    /** Get the currently selected voice object. */
    const selectedVoice = voices.find((v) => v.voiceURI === options.voiceUri) || null;

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
        voices,
        selectedVoice,
        options,
        isArabicText,
        currentText,
        speak,
        stop: cancelSpeech,
        pause,
        resume,
        toggle,
        setVoice,
        setRate,
        setPitch,
        setLanguage,
    };
}
