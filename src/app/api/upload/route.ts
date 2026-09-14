import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User } from '@/models/User';
import connectToDatabase from '@/utils/db';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    let session = null;
    if (userId) {
      await connectToDatabase();
      session = { user: await User.findOne({ clerkId: userId }) };
    }
    if (!session || !session.user || (session.user as any).role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const savedUrls: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      const secureUrl = await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'nestmatch_pgs' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result!.secure_url);
          }
        );
        uploadStream.end(buffer);
      });
      
      savedUrls.push(secureUrl);
    }

    return NextResponse.json({ success: true, urls: savedUrls });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}
