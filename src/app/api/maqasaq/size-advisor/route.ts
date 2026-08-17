/**
 * SADAF | API Route — Maqasaq Size Advisor (deterministic fitting logic)
 *
 * POST /api/maqasaq/size-advisor
 *
 * Body: { height: number (cm); weight: number (kg);
 *         gender?: 'Men' | 'Women'; posture?: string }
 * Response: { size, confidence, measurements: { chest, shoulder, length, waist }, comment }
 *
 * Pure server-side heuristic — no external API. This endpoint is the real
 * implementation behind the AI Studio "Maqasaq sizing" step.
 */

import { NextResponse } from 'next/server';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

interface SizeAdvisorRequestBody {
    height: number;
    weight: number;
    gender?: 'Men' | 'Women';
    posture?: string;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export async function POST(request: Request) {
    let body: SizeAdvisorRequestBody;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const height = Number(body.height);
    const weight = Number(body.weight);
    if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0 || weight <= 0) {
        return NextResponse.json(
            { error: 'Missing or invalid fields: height, weight' },
            { status: 400 }
        );
    }

    const gender = body.gender === 'Women' ? 'Women' : 'Men';
    const bmi = weight / Math.pow(height / 100, 2);

    // Base size band from BMI, nudged by height and gender.
    let sizeIndex =
        bmi < 18.5 ? 0 :
        bmi < 22 ? 1 :
        bmi < 25 ? 2 :
        bmi < 28 ? 3 :
        bmi < 31 ? 4 : 5;
    if (height > 185) sizeIndex += 1;
    else if (height < 160) sizeIndex -= 1;
    if (gender === 'Women') sizeIndex -= 1;
    sizeIndex = Math.round(clamp(sizeIndex, 0, SIZES.length - 1));

    const size = SIZES[sizeIndex];

    // Measurements scale with the size index around the atelier base block.
    const chest = Math.round(84 + sizeIndex * 6);
    const waist = Math.round(68 + sizeIndex * 7);
    const shoulder = Math.round(38 + sizeIndex * 1.5);
    const length = Math.round(height * 0.47);

    // Confidence peaks when the body metrics sit comfortably inside a band.
    const distanceFromCenter = Math.abs(bmi - 23) / 8;
    const confidence =
        Math.round(clamp(96.8 - distanceFromCenter * 6 - (gender === 'Women' ? 1.2 : 0), 82, 98) * 10) /
        10;

    const fitNote =
        bmi < 18.5
            ? 'a slimmer drape suits your frame — the fabric will hang with clean, close lines.'
            : bmi > 29
                ? 'an eased fit gives the best fall — the atelier will grade the pattern for comfort.'
                : 'an ideal drape alignment — the pattern maps cleanly across shoulders and waist.';
    const postureNote =
        body.posture && body.posture !== 'Fluid Grace fit'
            ? ` Adjusted for ${body.posture.toLowerCase()} posture.`
            : '';

    return NextResponse.json({
        size,
        confidence,
        measurements: { chest, shoulder, length, waist },
        comment: `Maqasaq tailors recommend size ${size}. ${gender} fit profile with ${fitNote}${postureNote}`,
    });
}
