import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectToDatabase from '@/utils/db';
import { User } from '@/models/User';
import { PGProperty } from '@/models/PGProperty';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to extract public ID from Cloudinary URL including folders
const extractPublicId = (url: string) => {
  try {
    // Example: https://res.cloudinary.com/.../upload/v1234567890/nestmatch_pgs/filename.jpg
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    
    const afterUpload = url.substring(uploadIndex + 8);
    const parts = afterUpload.split('/');
    
    // Remove the version number if it exists (starts with 'v' and followed by digits)
    if (parts[0].startsWith('v') && !isNaN(parseInt(parts[0].substring(1)))) {
      parts.shift();
    }
    
    const publicIdWithExt = parts.join('/');
    const lastDotIndex = publicIdWithExt.lastIndexOf('.');
    return lastDotIndex !== -1 ? publicIdWithExt.substring(0, lastDotIndex) : publicIdWithExt;
  } catch (e) {
    return null;
  }
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();
    
    if (!userId || !clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber;
    const isSuperAdmin = (email && email === process.env.ADMIN_EMAIL) || (phone && phone === process.env.ADMIN_PHONE);

    await connectToDatabase();
    
    // Check if the user is a super admin OR a regular admin in DB
    const user = await User.findOne({ clerkId: userId });
    const isAdmin = isSuperAdmin || (user && user.role === 'admin');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const { propertyId, action, reason } = await req.json();

    if (!propertyId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Valid propertyId and action (approve/reject) are required' }, { status: 400 });
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const property = await PGProperty.findById(propertyId).populate('owner_id');
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (action === 'approve') {
      property.kyc_status = 'verified';
      property.is_verified = true;
      property.kyc_rejection_reason = '';
    } else if (action === 'reject') {
      // Delete images from Cloudinary
      if (property.kyc_documents && Array.isArray(property.kyc_documents)) {
        for (const docUrl of property.kyc_documents) {
          const publicId = extractPublicId(docUrl);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId).catch((err) => {
              console.error('Failed to delete from Cloudinary:', err);
            });
          }
        }
      }

      property.kyc_status = 'rejected';
      property.is_verified = false;
      property.kyc_documents = [];
      property.kyc_rejection_reason = reason;
    }
    
    await property.save();

    // Send Email Notification to Owner
    const owner = property.owner_id as any;
    if (owner && owner.email && process.env.RESEND_API_KEY) {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const subject = action === 'approve' 
        ? '✅ NestMatch: Your Property KYC is Approved!' 
        : '❌ NestMatch: Your Property KYC was Rejected';
        
      const htmlContent = action === 'approve'
        ? `<p>Hello ${owner.name || 'Owner'},</p><p>Great news! The KYC for your property <strong>${property.name}</strong> has been verified. Your property is now live and trusted by tenants!</p><p>Regards,<br>NestMatch Team</p>`
        : `<p>Hello ${owner.name || 'Owner'},</p><p>We reviewed the KYC for your property <strong>${property.name}</strong>, but unfortunately, we had to reject it.</p><p><strong>Reason:</strong> ${reason}</p><p>Please log in to your dashboard and re-upload the correct documents.</p><p>Regards,<br>NestMatch Team</p>`;

      await resend.emails.send({
        from: 'NestMatch <onboarding@resend.dev>', // Use onboarding@resend.dev for testing if domain isn't verified
        to: owner.email,
        subject: subject,
        html: htmlContent
      }).catch((err: any) => console.error("Resend Email Error:", err));
    }

    return NextResponse.json({ success: true, message: `Property KYC ${action}d successfully`, property });

  } catch (error) {
    console.error('Error reviewing KYC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
