import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Readable } from 'stream';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import connectDB from '../../../lib/db';
import { Member, AuthCode } from '../../../lib/models';

function verifyPortalToken(req) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    if (!decoded.portal) return null;
    return decoded;
  } catch {
    return null;
  }
}

function uploadToGridFS(buffer, filename) {
  return new Promise((resolve, reject) => {
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'memberPhotos' });
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    const uploadStream = bucket.openUploadStream(filename, { contentType: 'image/jpeg' });
    readable.pipe(uploadStream);
    uploadStream.on('finish', () => resolve(uploadStream.id));
    uploadStream.on('error', reject);
  });
}

export async function POST(req) {
  try {
    const decoded = verifyPortalToken(req);
    if (!decoded) {
      return NextResponse.json(
        { message: 'Session expired. Please verify your code again.' },
        { status: 401 }
      );
    }

    await connectDB();

    const authCode = await AuthCode.findOne({});
    if (!authCode) {
      return NextResponse.json({ message: 'No active code found.' }, { status: 401 });
    }
    if (authCode.used) {
      return NextResponse.json(
        { message: 'This code has already been used. Ask the gym admin for a new one.' },
        { status: 401 }
      );
    }
    if (decoded.codeId && decoded.codeId !== authCode._id.toString()) {
      return NextResponse.json(
        { message: 'Code has changed. Please verify the new code.' },
        { status: 401 }
      );
    }

    let formData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ message: 'Invalid form data' }, { status: 400 });
    }

    const name        = (formData.get('name')        || '').toString().trim();
    const email       = (formData.get('email')       || '').toString().trim().toLowerCase();
    const phone       = (formData.get('phone')       || '').toString().trim();
    const address     = (formData.get('address')     || '').toString().trim();
    const dateOfBirth = (formData.get('dateOfBirth') || '').toString().trim();
    const gender      = (formData.get('gender')      || '').toString().trim();
    const notes       = (formData.get('notes')       || '').toString().trim();
    const photoFile   = formData.get('photo');

    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    let pendingPhotoId = null;
    if (photoFile && typeof photoFile === 'object' && photoFile.size > 0) {
      if (photoFile.size > 3 * 1024 * 1024) {
        return NextResponse.json({ message: 'Photo must be under 3 MB' }, { status: 400 });
      }
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowed.includes(photoFile.type)) {
        return NextResponse.json(
          { message: 'Only JPEG, PNG, or WebP images are allowed' },
          { status: 400 }
        );
      }
      const arrayBuffer = await photoFile.arrayBuffer();
      const buffer      = Buffer.from(arrayBuffer);
      const ext         = (photoFile.name || 'photo.jpg').split('.').pop() || 'jpg';
      pendingPhotoId    = await uploadToGridFS(buffer, `portal-${Date.now()}.${ext}`);
    }

    const member = await Member.create({
      name,
      email:       email       || undefined,
      phone:       phone       || undefined,
      address:     address     || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender:      gender      || undefined,
      notes:       notes       || undefined,
      pendingPhotoId,
      activeness:  'new',
      requestedAt: new Date(),
    });

    // Mark code as used — blocks any further submissions with this code
    await AuthCode.findByIdAndUpdate(authCode._id, { used: true });

    return NextResponse.json(
      {
        message:  'Registration submitted! The gym will review your application.',
        memberId: member._id,
      },
      { status: 201 }
    );

  } catch (err) {
    console.error('submit-member error:', err.message, err.stack);
    return NextResponse.json({ message: 'Server error: ' + err.message }, { status: 500 });
  }
}