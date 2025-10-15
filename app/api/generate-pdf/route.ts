import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateNameCertificate, isPDFGenerationAvailable } from '@/utils/pdf-generator';

// Ensure this route runs on the Node.js runtime (Puppeteer requires Node features)
export const runtime = 'nodejs';

interface NameData {
  chinese: string;
  pinyin: string;
  characters: Array<{
    character: string;
    pinyin: string;
    meaning: string;
    explanation: string;
  }>;
  meaning: string;
  culturalNotes: string;
  personalityMatch: string;
  style: string;
}

interface RequestBody {
  nameData: NameData;
  userData: {
    englishName: string;
    gender: string;
  };
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    console.log('=== PDF Generation API Called ===');
  }

  try {
    const supabase = await createClient();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required for PDF generation' },
        { status: 401 }
      );
    }

    const body: RequestBody = await request.json();
    const { nameData, userData } = body;

    if (!nameData || !userData) {
      return NextResponse.json(
        { error: 'Missing required data: nameData and userData' },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('PDF generation request:', {
        user: user.id,
        chineseName: nameData.chinese,
        englishName: userData.englishName
      });
    }

    // Check if PDF generation is available
    const isAvailable = await isPDFGenerationAvailable();
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'PDF generation service is currently unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // Check user credits
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching customer:', fetchError);
      return NextResponse.json(
        { error: 'Unable to verify user credits' },
        { status: 500 }
      );
    }

    if (!customer || customer.credits < 1) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Insufficient credits:', {
          hasCustomer: !!customer,
          credits: customer?.credits
        });
      }
      return NextResponse.json(
        {
          error: 'Insufficient credits. PDF generation requires 1 credit.',
          creditsRequired: 1,
          currentCredits: customer?.credits || 0
        },
        { status: 403 }
      );
    }

    // Generate PDF using the lazy-loaded utility
    try {
      const { buffer: pdfBuffer, fileName } = await generateNameCertificate(nameData, userData);

      if (process.env.NODE_ENV === 'development') {
        console.log('PDF generated successfully');
      }

      // Deduct credits
      const newCredits = customer.credits - 1;
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          credits: newCredits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to deduct credits:', updateError);
        // Note: PDF is generated, but credit deduction failed
        // In production, you might want to handle this better
      } else {
        // Record credit transaction history
        await supabase
          .from('credits_history')
          .insert({
            customer_id: customer.id,
            amount: 1,
            type: 'subtract',
            description: 'pdf_generation',
            metadata: {
              operation: 'pdf_generation',
              chinese_name: nameData.chinese,
              english_name: userData.englishName,
              credits_before: customer.credits,
              credits_after: newCredits,
              generated_at: new Date().toISOString()
            }
          });

        if (process.env.NODE_ENV === 'development') {
          console.log('Credits deducted successfully:', {
            userId: user.id,
            creditsBefore: customer.credits,
            creditsAfter: newCredits
          });
        }
      }

      // Return PDF response
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });

    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      return NextResponse.json(
        {
          error: 'Failed to generate PDF certificate. Please try again.',
          details: pdfError instanceof Error ? pdfError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('PDF generation API error:', error);
    return NextResponse.json(
      {
        error: 'PDF generation service is temporarily unavailable. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
