import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { z } from 'zod';

const sendVerificationSchema = z.object({
  email: z.string().email(),
});

// Store verification codes in memory (in production, use Redis or similar)
const verificationCodes = new Map<string, { code: string; expires: number }>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = sendVerificationSchema.parse(body);

    // Generate 6-digit code
    const code = generateCode();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code
    verificationCodes.set(data.email, { code, expires });

    // In production, send via email service (SendGrid, AWS SES, etc.)
    // For now, we'll return it in the response for testing
    console.log(`Verification code for ${data.email}: ${code}`);

    // TODO: Send email using your preferred email service
    // Example with a hypothetical email service:
    // await sendEmail({
    //   to: data.email,
    //   subject: 'Verify your AKADEMO account',
    //   html: `Your verification code is: <strong>${code}</strong>. This code expires in 10 minutes.`
    // });

    return Response.json(
      successResponse({
        message: 'Verification code sent',
        // Remove this in production:
        code, // For testing purposes only
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
