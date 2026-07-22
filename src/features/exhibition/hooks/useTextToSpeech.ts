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
 * - Multi-language: auto-detects Arabic, French, German and sets lang accordingly
 * - Voice preview: test a voice before using it
 * - Settings persistence via localStorage
 * - Fallback detection for browsers without SpeechSynthesis
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'sadaf_exhibition_tts_settings';

export type TtsLang = 'en' | 'ar' | 'fr' | 'de';

export interface TtsOptions {
    rate: number;
    pitch: number;
    voiceUri: string | null;
    lang: TtsLang;
}

const DEFAULT_OPTIONS: TtsOptions = {
    rate: 0.85,
    pitch: 1.0,
    voiceUri: null,
    lang: 'en',
};

/** Detect if text contains Arabic characters (Unicode range 0600-06FF+). */
function containsArabic(text: string): boolean {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/** Detect if text contains French-specific characters. */
function containsFrench(text: string): boolean {
    return /[éèêëàâäùûüôöîïçœæÉÈÊËÀÂÄÙÛÜÔÖÎÏÇŒÆ]/.test(text);
}

/** Detect if text contains German-specific characters. */
function containsGerman(text: string): boolean {
    return /[äöüßÄÖÜ]/.test(text);
}

/** Detect the most likely language from the text content. */
function detectTextLanguage(text: string): TtsLang {
    if (containsArabic(text)) return 'ar';
    const germanScore = (text.match(/[äöüßÄÖÜ]/g) || []).length;
    const frenchScore = (text.match(/[éèêëàâäùûüôöîïçœæ]/gi) || []).length;
    // Use >= 1 to catch single-accent French words like "Café" or "très"
    if (germanScore > 0 && germanScore >= frenchScore) return 'de';
    if (frenchScore >= 1) return 'fr';
    return 'en';
}

/** Get the BCP 47 lang tag for a TtsLang. */
function langToBCP47(lang: TtsLang): string {
    switch (lang) {
        case 'ar': return 'ar-SA';
        case 'fr': return 'fr-FR';
        case 'de': return 'de-DE';
        default: return 'en-US';
    }
}

/** Load saved options from localStorage. */
function loadSavedOptions(): TtsOptions | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            // Validate shape
            if (typeof parsed === 'object' && parsed !== null) {
                return {
                    rate: typeof parsed.rate === 'number' ? parsed.rate : DEFAULT_OPTIONS.rate,
                    pitch: typeof parsed.pitch === 'number' ? parsed.pitch : DEFAULT_OPTIONS.pitch,
                    voiceUri: typeof parsed.voiceUri === 'string' ? parsed.voiceUri : null,
                    lang: (['en', 'ar', 'fr', 'de'] as TtsLang[]).includes(parsed.lang)
                        ? parsed.lang
                        : DEFAULT_OPTIONS.lang,
                };
            }
        }
    } catch {
        // Ignore corrupted data
    }
    return null;
}

/** Save options to localStorage. */
function saveOptions(options: TtsOptions): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {
        // Storage full or unavailable — silently ignore
    }
}

/**
 * React hook that manages the browser SpeechSynthesis lifecycle.
 */
export function useTextToSpeech() {
    const [isSpeechSupported, setIsSpeechSupported] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [options, setOptions] = useState<TtsOptions>(() => {
        return loadSavedOptions() || DEFAULT_OPTIONS;
    });
    const [currentText, setCurrentText] = useState('');
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const wordCountRef = useRef(0);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    // Derived language detection
    const isArabicText = containsArabic(currentText);
    const isFrenchText = containsFrench(currentText);
    const isGermanText = containsGerman(currentText);
    const detectedLang: TtsLang = currentText ? detectTextLanguage(currentText) : options.lang;

    // Presence of voices by language
    const hasArabicVoices = voices.some((v) => v.lang.startsWith('ar'));
    const hasFrenchVoices = voices.some((v) => v.lang.startsWith('fr'));
    const hasGermanVoices = voices.some((v) => v.lang.startsWith('de'));

    /** Persist options when they change. */
    const persistOptions = useCallback((updated: TtsOptions) => {
        saveOptions(updated);
    }, []);

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

    // Detect SpeechSynthesis support on mount
    useEffect(() => {
        const supported = typeof window !== 'undefined' &&
            'speechSynthesis' in window &&
            typeof window.speechSynthesis === 'object';
        setIsSpeechSupported(supported);
    }, []);

    // Load voices on mount and when they change (Chrome loads them async)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.speechSynthesis?.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        loadVoices();

        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, [loadVoices]);

    // Persist options to localStorage whenever they change
    useEffect(() => {
        persistOptions(options);
    }, [options, persistOptions]);

    /** Cancel any ongoing speech and clean up. */
    const cancelSpeech = useCallback(() => {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentWordIndex(0);
        utteranceRef.current = null;
    }, []);

    /** Speak the given text aloud using current options. Auto-detects language. */
    const speak = useCallback((text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        if (!text.trim()) return;

        setCurrentText(text);

        const opts = optionsRef.current;
        const utterance = new SpeechSynthesisUtterance(text);

        // Auto-detect language from text content
        utterance.lang = langToBCP47(detectTextLanguage(text));
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

    /** Preview a voice by speaking a sample phrase in its language. */
    const previewVoice = useCallback((voiceUri: string) => {
        if (!window.speechSynthesis) return;
        const matched = voices.find((v) => v.voiceURI === voiceUri);
        if (!matched) return;

        window.speechSynthesis.cancel();

        const sampleText = matched.lang.startsWith('ar')
            ? 'مرحباً بكم في متحف سدف'
            : matched.lang.startsWith('fr')
                ? 'Bienvenue au musée SADAF'
                : matched.lang.startsWith('de')
                    ? 'Willkommen im SADAF Museum'
                    : 'Welcome to SADAF Museum';

        const utterance = new SpeechSynthesisUtterance(sampleText);
        utterance.voice = matched;
        utterance.lang = matched.lang;
        utterance.rate = optionsRef.current.rate;
        utterance.pitch = optionsRef.current.pitch;
        window.speechSynthesis.speak(utterance);
    }, [voices]);

    /** Pause the current utterance. */
    const pause = useCallback(() => {
        if (window.speechSynthesis?.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    }, []);

    /** Resume a paused utterance. */
    const resume = useCallback(() => {
        if (window.speechSynthesis?.paused) {
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

    /** Set the active language. Auto-selects the first matching voice. */
    const setLanguage = useCallback((lang: TtsLang) => {
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
            window.speechSynthesis?.cancel();
        };
    }, []);

    return {
        isSpeechSupported,
        isSpeaking,
        isPaused,
        currentWordIndex,
        voices,
        selectedVoice,
        options,
        isArabicText,
        isFrenchText,
        isGermanText,
        detectedLang,
        currentText,
        hasArabicVoices,
        hasFrenchVoices,
        hasGermanVoices,
        speak,
        stop: cancelSpeech,
        pause,
        resume,
        toggle,
        previewVoice,
        setVoice,
        setRate,
        setPitch,
        setLanguage,
    };
}
