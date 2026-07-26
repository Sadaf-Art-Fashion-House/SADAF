/**
 * SADAF | Google Cloud TTS Client Service
 *
 * Client-side wrapper that calls our Next.js API route (/api/tts)
 * which in turn calls Google Cloud Text-to-Speech.
 *
 * Features:
 * - Synthesize Arabic (or any language) text to audio
 * - Returns a playable Audio element
 * - Clear error handling when API key is missing or request fails
 */

export interface GoogleTtsResult {
    success: boolean;
    audio?: HTMLAudioElement;
    error?: string;
}

/** Arabic voice options in Google Cloud TTS (ar-XA = Modern Standard Arabic). */
export const ARABIC_VOICES: Array<{
    name: string;
    gender: 'FEMALE' | 'MALE';
    label: string;
    quality: 'Standard' | 'Wavenet' | 'Studio';
}> = [
    { name: 'ar-XA-Standard-A', gender: 'FEMALE', label: 'Standard A (Female)', quality: 'Standard' },
    { name: 'ar-XA-Standard-B', gender: 'MALE', label: 'Standard B (Male)', quality: 'Standard' },
    { name: 'ar-XA-Standard-C', gender: 'FEMALE', label: 'Standard C (Female)', quality: 'Standard' },
    { name: 'ar-XA-Standard-D', gender: 'MALE', label: 'Standard D (Male)', quality: 'Standard' },
    { name: 'ar-XA-Wavenet-A', gender: 'FEMALE', label: 'Wavenet A (Female)', quality: 'Wavenet' },
    { name: 'ar-XA-Wavenet-B', gender: 'MALE', label: 'Wavenet B (Male)', quality: 'Wavenet' },
    { name: 'ar-XA-Wavenet-C', gender: 'FEMALE', label: 'Wavenet C (Female)', quality: 'Wavenet' },
    { name: 'ar-XA-Wavenet-D', gender: 'MALE', label: 'Wavenet D (Male)', quality: 'Wavenet' },
    { name: 'ar-XA-Studio-A', gender: 'FEMALE', label: 'Studio A (Female)', quality: 'Studio' },
    { name: 'ar-XA-Studio-B', gender: 'MALE', label: 'Studio B (Male)', quality: 'Studio' },
];

/** Get the best Arabic voice name based on quality preference. */
export function getBestArabicVoiceName(
    quality: 'Wavenet' | 'Studio' | 'Standard' = 'Wavenet'
): string {
    const byQuality = ARABIC_VOICES.filter((v) => v.quality === quality);
    if (byQuality.length > 0) return byQuality[0].name;
    // Fallback: Standard
    const standard = ARABIC_VOICES.filter((v) => v.quality === 'Standard');
    return standard[0]?.name || 'ar-XA-Standard-A';
}

/**
 * Synthesize speech using Google Cloud TTS via our API route.
 *
 * @param text - The text to speak
 * @param languageCode - BCP 47 language tag (e.g. 'ar-XA', 'en-US', 'fr-FR')
 * @param voiceName - Optional specific voice name (e.g. 'ar-XA-Wavenet-A')
 * @returns GoogleTtsResult with an Audio element on success
 */
export async function synthesizeSpeech(
    text: string,
    languageCode: string,
    voiceName?: string
): Promise<GoogleTtsResult> {
    try {
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                languageCode,
                voiceName: voiceName || undefined,
                gender: 'FEMALE',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'TTS request failed',
            };
        }

        // data.audioContent is base64-encoded MP3
        if (!data.audioContent) {
            return { success: false, error: 'No audio content in response' };
        }

        // Convert base64 to a playable blob URL
        const byteCharacters = atob(data.audioContent);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);

        const audio = new Audio(blobUrl);

        // Clean up the blob URL after the audio finishes playing
        audio.addEventListener('ended', () => {
            URL.revokeObjectURL(blobUrl);
        });
        audio.addEventListener('error', () => {
            URL.revokeObjectURL(blobUrl);
        });

        return { success: true, audio };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
    }
}

/**
 * Check whether Google Cloud TTS is available (i.e., the API key is configured).
 * Makes a lightweight check by calling the API with an empty text request.
 */
export async function isGoogleTtsAvailable(): Promise<boolean> {
    try {
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: '', languageCode: 'ar-XA' }),
        });
        const data = await response.json();
        // If the API key is missing, we get a 400 with error about missing key
        if (!response.ok && data.error?.includes('API key not configured')) {
            return false;
        }
        return response.ok;
    } catch {
        return false;
    }
}
