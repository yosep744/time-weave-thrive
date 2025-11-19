import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reflection, timeBlocks } = await req.json();

    // Input validation
    if (reflection && reflection.length > 2000) {
      throw new Error('Reflection too long (max 2000 characters)');
    }

    if (!Array.isArray(timeBlocks) || timeBlocks.length > 100) {
      throw new Error('Invalid timeBlocks (must be array, max 100 items)');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Prepare time blocks summary
    const categoryStats: Record<string, number> = {};
    timeBlocks.forEach((block: any) => {
      const [startHour, startMin] = block.startTime.split(':').map(Number);
      const [endHour, endMin] = block.endTime.split(':').map(Number);
      const duration = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;

      categoryStats[block.category] = (categoryStats[block.category] || 0) + duration;
    });

    const timeBlocksSummary = Object.entries(categoryStats)
      .map(([category, hours]) => `${category}: ${hours.toFixed(1)}시간`)
      .join(', ');

    const systemPrompt = `당신은 사용자의 시간 관리와 일상을 분석하고 긍정적인 피드백을 제공하는 AI 코치입니다. 
사용자의 하루를 분석하고 구체적이고 실천 가능한 조언을 제공하세요.
한국어로 따뜻하고 공감하는 어조로 답변하세요.`;

    const userPrompt = `오늘의 시간 사용:
${timeBlocksSummary}

오늘의 성찰:
${reflection}

위 내용을 바탕으로:
1. 오늘 하루 시간 사용의 균형을 분석해주세요
2. 잘한 점과 개선할 점을 구체적으로 알려주세요
3. 내일을 위한 실천 가능한 조언 2-3가지를 제시해주세요

200자 이내로 간결하게 답변해주세요.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: '사용 한도를 초과했습니다. 워크스페이스에 크레딧을 추가해주세요.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI 피드백 생성에 실패했습니다.');
    }

    const data = await response.json();
    const feedback = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ feedback }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-feedback function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
