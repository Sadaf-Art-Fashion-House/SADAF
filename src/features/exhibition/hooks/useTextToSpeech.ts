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
 * - Auto-select best Arabic voice from system voices
 * - Google Cloud TTS fallback when no local Arabic voice exists
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
    synthesizeSpeech,
    getBestArabicVoiceName,
    type GoogleTtsResult,
} from '@/lib/tts/googleTts';

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

/** Get the Google Cloud TTS language code for a TtsLang. */
function langToGoogleCode(lang: TtsLang): string {
    switch (lang) {
        case 'ar': return 'ar-XA';
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

/** Find the best Arabic voice from available system voices. */
function findBestArabicVoice(
    voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
    // Priority 1: Local service Arabic voices
    const localAr = voices.filter((v) => v.lang.startsWith('ar') && v.localService);
    if (localAr.length > 0) return localAr[0];
    // Priority 2: Any Arabic voice
    const anyAr = voices.filter((v) => v.lang.startsWith('ar'));
    if (anyAr.length > 0) return anyAr[0];
    return null;
}

/** Find the best voice for a given language. */
function findBestVoiceForLang(
    voices: SpeechSynthesisVoice[],
    lang: TtsLang
): SpeechSynthesisVoice | null {
    if (lang === 'ar') return findBestArabicVoice(voices);
    // For other languages: prefer local service, then any match
    const local = voices.find((v) => v.lang.startsWith(lang) && v.localService);
    if (local) return local;
    return voices.find((v) => v.lang.startsWith(lang)) || null;
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
    const [voiceSource, setVoiceSource] = useState<'system' | 'google-tts'>('system');
    const [isGoogleTtsLoading, setIsGoogleTtsLoading] = useState(false);
    const [googleTtsConfigured, setGoogleTtsConfigured] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const googleAudioRef = useRef<HTMLAudioElement | null>(null);
    const wordCountRef = useRef(0);
    const optionsRef = useRef(options);
    optionsRef.current = options;
    const googleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Derived language detection
    const isArabicText = containsArabic(currentText);
    const isFrenchText = containsFrench(currentText);
    const isGermanText = containsGerman(currentText);
    const detectedLang: TtsLang = currentText ? detectTextLanguage(currentText) : options.lang;

    // Presence of voices by language
    const hasArabicVoices = voices.some((v) => v.lang.startsWith('ar'));
    const hasFrenchVoices = voices.some((v) => v.lang.startsWith('fr'));
    const hasGermanVoices = voices.some((v) => v.lang.startsWith('de'));

    /** Whether Arabic is selected AND no system Arabic voice exists. */
    const isArabicWithoutVoice = options.lang === 'ar' && !hasArabicVoices;

    /** Whether Google TTS should be used as fallback for Arabic. */
    const shouldUseGoogleTts = isArabicText && !hasArabicVoices;

    /** The most helpful message about voice status for the current language. */
    const voiceStatusMessage: string = (() => {
        if (options.lang !== 'ar') return '';
        if (hasArabicVoices) return '';
        if (googleTtsConfigured) return '☁️ Google Cloud TTS متاح — سيتم تشغيل العربية بصوت احترافي من Google';
        return '⚠️ لا يوجد صوت عربي مثبت. للمساعدة: ركب حزمة اللغة العربية من Windows Settings ← Time & Language ← Speech، أو أضف GOOGLE_TTS_API_KEY في ملف .env.local';
    })();

    /** Persist options when they change. */
    const persistOptions = useCallback((updated: TtsOptions) => {
        saveOptions(updated);
    }, []);

    /** Clean up Google TTS audio and intervals. */
    const cleanupGoogleTts = useCallback(() => {
        if (googleAudioRef.current) {
            googleAudioRef.current.pause();
            googleAudioRef.current = null;
        }
        if (googleIntervalRef.current) {
            clearTimeout(googleIntervalRef.current);
            googleIntervalRef.current = null;
        }
        setIsGoogleTtsLoading(false);
    }, []);

    /** Check if Google TTS API is configured (lightweight).
     *  Uses GET /api/tts?check=1 which returns { ok: true } when the API key exists,
     *  avoiding the empty-text ambiguity of POST. */
    const checkGoogleTtsConfig = useCallback(async () => {
        try {
            const res = await fetch('/api/tts?check=1');
            const data = await res.json();
            setGoogleTtsConfigured(data?.ok === true);
        } catch {
            setGoogleTtsConfigured(false);
        }
    }, []);

    /** Load available voices from the browser. */
    const loadVoices = useCallback(() => {
        const available = window.speechSynthesis.getVoices();
        if (available.length > 0) {
            setVoices(available);
            // Auto-select first voice matching current language if none selected
            setOptions((prev) => {
                if (!prev.voiceUri) {
                    const best = findBestVoiceForLang(available, prev.lang);
                    return {
                        ...prev,
                        voiceUri: best?.voiceURI || available[0]?.voiceURI || null,
                    };
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

    // Load voices and check Google TTS config on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.speechSynthesis?.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        loadVoices();
        checkGoogleTtsConfig();

        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, [loadVoices, checkGoogleTtsConfig]);

    // Persist options to localStorage whenever they change
    useEffect(() => {
        persistOptions(options);
    }, [options, persistOptions]);

    /** Play Arabic text via Web Speech API as fallback (when Google TTS unavailable/failed). */
    const playArabicFallback = useCallback((text: string, opts: TtsOptions, wordCount: number) => {
        const fallback = new SpeechSynthesisUtterance(text);
        fallback.lang = 'ar-SA';
        fallback.rate = opts.rate;
        fallback.pitch = opts.pitch;
        fallback.volume = 1;
        // Try to use the selected voice, fall back to any voice if needed
        if (opts.voiceUri) {
            const matched = voices.find((v) => v.voiceURI === opts.voiceUri);
            if (matched) fallback.voice = matched;
        }
        fallback.onstart = () => { setCurrentWordIndex(0); };
        fallback.onboundary = (event) => {
            if (event.name === 'word') {
                setCurrentWordIndex((prev) => Math.min(prev + 1, wordCount));
            }
        };
        fallback.onend = () => {
            setIsSpeaking(false);
            setCurrentWordIndex(wordCount);
            utteranceRef.current = null;
        };
        fallback.onerror = (event) => {
            if (event.error === 'canceled' || event.error === 'interrupted') return;
            console.error('Fallback SpeechSynthesis error:', event.error);
            setIsSpeaking(false);
        };
        utteranceRef.current = fallback;
        window.speechSynthesis.speak(fallback);
    }, [voices]);

    /** Cancel any ongoing speech and clean up. */
    const cancelSpeech = useCallback(() => {
        window.speechSynthesis?.cancel();
        cleanupGoogleTts();
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentWordIndex(0);
        utteranceRef.current = null;
    }, [cleanupGoogleTts]);

    /**
     * Workaround for the well-known Chrome SpeechSynthesis bug (crbug.com/783280).
     * After `speechSynthesis.cancel()`, Chrome sometimes ignores the very next
     * `speak()` call when a non-default voice is specified. A 50ms delay between
     * cancel and speak reliably works around this.
     */
    function speakAfterCancel(delayMs: number, fn: () => void) {
        setTimeout(fn, delayMs);
    }

    /** Speak the given text aloud using current options. Auto-detects language. */
    const speak = useCallback((text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        cleanupGoogleTts();
        if (!text.trim()) return;

        // Chrome bug workaround: small delay after cancel before speaking
        speakAfterCancel(50, () => {
            setCurrentText(text);

            const opts = optionsRef.current;
            const detected = detectTextLanguage(text);
            const wordCount = text.split(/\s+/).length;
            wordCountRef.current = wordCount;

            // If speaking Arabic and no system Arabic voice exists
            if (detected === 'ar' && !hasArabicVoices) {
                setIsSpeaking(true);
                setCurrentWordIndex(0);

                // If Google TTS is configured, use it for high-quality audio
                if (googleTtsConfigured) {
                    setVoiceSource('google-tts');
                    setIsGoogleTtsLoading(true);

                    // Silent utterance for word tracking
                    const silentUtterance = new SpeechSynthesisUtterance(text);
                    silentUtterance.lang = 'ar-SA';
                    silentUtterance.volume = 0;
                    silentUtterance.rate = opts.rate;
                    silentUtterance.pitch = opts.pitch;
                    if (opts.voiceUri) {
                        const matched = voices.find((v) => v.voiceURI === opts.voiceUri);
                        if (matched) silentUtterance.voice = matched;
                    }
                    silentUtterance.onstart = () => setCurrentWordIndex(0);
                    silentUtterance.onboundary = (event) => {
                        if (event.name === 'word') {
                            setCurrentWordIndex((prev) => Math.min(prev + 1, wordCount));
                        }
                    };
                    silentUtterance.onend = () => setCurrentWordIndex(wordCount);
                    utteranceRef.current = silentUtterance;
                    window.speechSynthesis.speak(silentUtterance);

                    // Call Google Cloud TTS
                    const googleLang = langToGoogleCode(detected);
                    const googleVoice = getBestArabicVoiceName('Wavenet');

                    synthesizeSpeech(text, googleLang, googleVoice).then(
                        (result: GoogleTtsResult) => {
                            setIsGoogleTtsLoading(false);
                            if (result.success && result.audio) {
                                googleAudioRef.current = result.audio;
                                result.audio.addEventListener('ended', () => {
                                    setCurrentWordIndex(wordCount);
                                    setIsSpeaking(false);
                                    setVoiceSource('system');
                                });
                                result.audio.addEventListener('error', () => {
                                    setIsSpeaking(false);
                                    setVoiceSource('system');
                                });
                                result.audio.play().catch((err: Error) => {
                                    console.error('Google TTS audio play failed:', err);
                                    setIsSpeaking(false);
                                });
                            } else {
                                // Google TTS failed — fall back to Web Speech
                                console.warn('Google TTS failed, falling back to Web Speech:', result.error);
                                setVoiceSource('system');
                                playArabicFallback(text, opts, wordCount);
                            }
                        }
                    );

                    // Safety fallback: if Google TTS doesn't respond in 10 seconds
                    const fallbackTimer = setTimeout(() => {
                        if (googleAudioRef.current) return;
                        setIsGoogleTtsLoading(false);
                        setVoiceSource('system');
                        window.speechSynthesis.cancel();
                        playArabicFallback(text, opts, wordCount);
                    }, 10000);
                    googleIntervalRef.current = fallbackTimer;
                } else {
                    // Google TTS not configured — use Web Speech directly with lang='ar-SA'
                    setVoiceSource('system');
                    playArabicFallback(text, opts, wordCount);
                }

                return;
            }

            // Default: use Web Speech API
            setVoiceSource('system');
            const utterance = new SpeechSynthesisUtterance(text);

            utterance.lang = langToBCP47(detected);
            utterance.rate = opts.rate;
            utterance.pitch = opts.pitch;

            if (opts.voiceUri) {
                const matched = voices.find((v) => v.voiceURI === opts.voiceUri);
                if (matched) utterance.voice = matched;
            }

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
        });
    }, [voices, hasArabicVoices, cleanupGoogleTts, playArabicFallback, googleTtsConfigured]);

    /** Preview a voice by speaking a sample phrase in its language. */
    const previewVoice = useCallback((voiceUri: string) => {
        if (!window.speechSynthesis) return;
        const matched = voices.find((v) => v.voiceURI === voiceUri);
        if (!matched) return;

        window.speechSynthesis.cancel();

        // Chrome bug workaround: small delay after cancel before speaking
        speakAfterCancel(50, () => {
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
        });
    }, [voices]);

    /** Preview Google TTS voice for Arabic. */
    const previewGoogleVoice = useCallback(async () => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        cleanupGoogleTts();

        const sampleText = 'مرحباً بكم في متحف سدف';
        const result = await synthesizeSpeech(sampleText, 'ar-XA', getBestArabicVoiceName('Wavenet'));
        if (result.success && result.audio) {
            googleAudioRef.current = result.audio;
            result.audio.play().catch(console.error);
        }
    }, [cleanupGoogleTts]);

    /** Pause the current utterance. */
    const pause = useCallback(() => {
        // Try pausing Google TTS audio first
        if (googleAudioRef.current && !googleAudioRef.current.paused) {
            googleAudioRef.current.pause();
            setIsPaused(true);
            return;
        }
        if (window.speechSynthesis?.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    }, []);

    /** Resume a paused utterance. */
    const resume = useCallback(() => {
        // Try resuming Google TTS audio first
        if (googleAudioRef.current && googleAudioRef.current.paused && !googleAudioRef.current.ended) {
            googleAudioRef.current.play().catch(console.error);
            setIsPaused(false);
            return;
        }
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

    /** Set the active language. Auto-selects the best matching voice. */
    const setLanguage = useCallback((lang: TtsLang) => {
        const best = findBestVoiceForLang(voices, lang);
        setOptions((prev) => ({
            ...prev,
            lang,
            voiceUri: best?.voiceURI || prev.voiceUri,
        }));
    }, [voices]);

    /** Get the currently selected voice object. */
    const selectedVoice = voices.find((v) => v.voiceURI === options.voiceUri) || null;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis?.cancel();
            cleanupGoogleTts();
        };
    }, [cleanupGoogleTts]);

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
        shouldUseGoogleTts,
        isArabicWithoutVoice,
        googleTtsConfigured,
        voiceStatusMessage,
        voiceSource,
        isGoogleTtsLoading,
        speak,
        stop: cancelSpeech,
        pause,
        resume,
        toggle,
        previewVoice,
        previewGoogleVoice,
        setVoice,
        setRate,
        setPitch,
        setLanguage,
    };
}
