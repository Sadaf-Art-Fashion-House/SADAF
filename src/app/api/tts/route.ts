/**
 * SADAF | API Route — Google Cloud Text-to-Speech
 *
 * POST /api/tts
 *
 * Body: { text: string; languageCode: string; voiceName?: string; gender?: 'FEMALE' | 'MALE' | 'NEUTRAL' }
 * Response: { audioContent: string } (base64-encoded MP3 audio)
 *
 * Requires GOOGLE_TTS_API_KEY environment variable to be set.
 * If the key is missing, returns 400 with a clear error.
 */

import { NextResponse } from 'next/server';

const GOOGLE_TTS_ENDPOINT =
    'https://texttospeech.googleapis.com/v1/text:synthesize';

interface TtsRequestBody {
    text: string;
    languageCode: string;
    voiceName?: string;
    gender?: 'FEMALE' | 'MALE' | 'NEUTRAL';
}

/** GET /api/tts?check=1 — lightweight health check to see if the API key is configured. */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const isCheck = searchParams.get('check') === '1';
    if (isCheck) {
        const apiKey = process.env.GOOGLE_TTS_API_KEY;
        return NextResponse.json({ ok: !!apiKey });
    }
    return NextResponse.json({ ok: false }, { status: 404 });
}

export async function POST(request: Request) {
    try {
        const apiKey = process.env.GOOGLE_TTS_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                {
                    error:
                        'Google Cloud TTS API key not configured. Set GOOGLE_TTS_API_KEY in your environment variables.',
                    hint: 'Get a key at https://console.cloud.google.com/apis/credentials',
                },
                { status: 400 }
            );
        }

        const body: TtsRequestBody = await request.json();

        if (!body.text || !body.languageCode) {
            return NextResponse.json(
                { error: 'Missing required fields: text, languageCode' },
                { status: 400 }
            );
        }

        const googleResponse = await fetch(
            `${GOOGLE_TTS_ENDPOINT}?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text: body.text },
                    voice: {
                        languageCode: body.languageCode,
                        name: body.voiceName || undefined,
                        ssmlGender: body.gender || 'FEMALE',
                    },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        speakingRate: 1.0,
                        pitch: 0,
                        volumeGainDb: 0,
                    },
                }),
            }
        );

        if (!googleResponse.ok) {
            const errorText = await googleResponse.text();
            console.error(
                'Google TTS API error:',
                googleResponse.status,
                errorText
            );
            return NextResponse.json(
                {
                    error: 'Google Cloud TTS API request failed',
                    status: googleResponse.status,
                    details: errorText,
                },
                { status: googleResponse.status }
            );
        }

        const data = await googleResponse.json();

        return NextResponse.json({
            audioContent: data.audioContent,
        });
    } catch (error) {
        console.error('Google TTS API error:', error);
        return NextResponse.json(
            { error: 'Internal server error processing TTS request' },
            { status: 500 }
        );
    }
}
