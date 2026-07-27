/**
 * SADAF | API Route — Send Email via SMTP
 *
 * POST /api/email/send
 *
 * Body: { to: string | string[]; subject: string; text: string; html?: string }
 *
 * Environment variables required for SMTP:
 *   SMTP_HOST     — e.g. smtp.gmail.com
 *   SMTP_PORT     — e.g. 587
 *   SMTP_USER     — your email address
 *   SMTP_PASS     — app password or SMTP password
 *   EMAIL_FROM    — sender address (defaults to SMTP_USER)
 *
 * If SMTP env vars are missing, the endpoint returns 400 with setup instructions.
 */

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

function getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
}

export async function POST(request: Request) {
    try {
        const transporter = getTransporter();

        if (!transporter) {
            return NextResponse.json(
                {
                    error: 'SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in environment variables.',
                    hint: 'For Gmail: use smtp.gmail.com, port 587, and an App Password (not your regular password).',
                    docs: 'https://nodemailer.com/smtp/',
                },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { to, subject, text, html } = body;

        if (!to || !subject || !text) {
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, text' },
                { status: 400 }
            );
        }

        const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

        const recipients = Array.isArray(to) ? to.join(', ') : to;

        const info = await transporter.sendMail({
            from: `"SADAF Error Monitor" <${from}>`,
            to: recipients,
            subject,
            text,
            html: html || text.replace(/\n/g, '<br/>'),
        });

        console.log(`[Email Sent] to: ${recipients} | subject: ${subject} | messageId: ${info.messageId}`);

        return NextResponse.json({
            ok: true,
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected,
        });
    } catch (error) {
        console.error('[Email Error]', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to send email', details: message },
            { status: 500 }
        );
    }
}

/** GET /api/email/send?check=1 — health check to see if SMTP is configured. */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('check') === '1') {
        const transporter = getTransporter();
        return NextResponse.json({
            configured: !!transporter,
            host: process.env.SMTP_HOST || null,
            hasUser: !!process.env.SMTP_USER,
            hasPass: !!process.env.SMTP_PASS,
        });
    }
    return NextResponse.json({ ok: false }, { status: 404 });
}
