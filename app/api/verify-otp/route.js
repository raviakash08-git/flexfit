import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/db';
import { AuthCode } from '../../../lib/models';

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const code = (body.code || '').toString().trim();
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ message: 'Enter a valid 6-digit code' }, { status: 400 });
    }

    await connectDB();
    const authCode = await AuthCode.findOne({});

    if (!authCode) {
      return NextResponse.json(
        { message: 'No active code. Ask the gym admin to generate one.' },
        { status: 404 }
      );
    }

    if (authCode.used) {
      return NextResponse.json(
        { message: 'This code has already been used. Ask the gym admin for a new one.' },
        { status: 401 }
      );
    }

    if (authCode.code.trim() !== code) {
      return NextResponse.json(
        { message: 'Incorrect code. Please try again.' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { portal: true, verified: true, codeId: authCode._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.PORTAL_JWT_EXPIRY || '2h' }
    );

    return NextResponse.json({ token, message: 'Verified' });

  } catch (err) {
    console.error('verify-otp error:', err.message);
    return NextResponse.json({ message: 'Server error: ' + err.message }, { status: 500 });
  }
}