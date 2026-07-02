import type { NextApiRequest, NextApiResponse } from 'next';

interface SignupResponse {
  url: string;
  updatedAt: string;
}

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<SignupResponse>
) {
  // Get Sugargoo signup URL from environment variable
  // This should be updated monthly with a new invitation link
  const signupUrl =
    process.env.SUGARGOO_SIGNUP_URL ||
    'https://www.sugargoo.com/auth/register?invite_code=XXXXX';

  // Cache for 24 hours
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800');

  res.status(200).json({
    url: signupUrl,
    updatedAt: new Date().toISOString(),
  });
}
