
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { message, history } = await req.json()

        // 1. Get Gemini API Key
        const { data: aiSettings, error: aiError } = await supabaseClient
            .from('site_settings')
            .select('value')
            .eq('key', 'ai_gemini_api_key')
            .single()

        if (aiError || !aiSettings?.value) {
            throw new Error('A inteligência artificial ainda não foi configurada pelo administrador.')
        }

        const geminiApiKey = aiSettings.value

        // 2. Get Products Context
        const { data: products, error: productsError } = await supabaseClient
            .from('products')
            .select('id, name, description, price')
            .eq('is_active', true)
            .limit(50)

        if (productsError) throw new Error('Falha ao carregar produtos do catálogo.')

        const productsContext = products.map(p =>
            `ID: ${p.id} | Nome: ${p.name} | Preço: R$${p.price} | Descrição: ${p.description?.substring(0, 100)}...`
        ).join('\n')

        // 3. Prompt Gemini
        const prompt = `
            Você é a tIAdoro, uma assistente virtual simpática, empática e divertida da plataforma de presentes "theAdoro".
            Seu objetivo é ajudar usuários a encontrar o presente perfeito entre os itens do catálogo.

            Contexto da Loja (Produtos Disponíveis no Banco):
            ${productsContext}

            Instruções:
            1. Responda em Português do Brasil com um tom humanizado, acolhedor e ocasionalmente usando emojis.
            2. Analise profundamente o que o usuário quer (idade, gostos, ocasião).
            3. Selecione até 3 produtos do catálogo que mais se encaixam. Se nenhum encaixar perfeitamente, sugira os mais próximos e explique o porquê de forma criativa.
            4. Se o usuário falar sobre algo que não temos no catálogo, dê dicas gerais de presente e sugira itens da loja que poderiam complementar.
            5. Retorne OBRIGATORIAMENTE um JSON puro com os seguintes campos:
               - "text": Uma mensagem humanizada completa explicando suas escolhas.
               - "product_ids": Um array de strings com os IDs (UUIDs) dos produtos sugeridos.

            Exemplo de Saída Esperada:
            {
                "text": "Olá! Que ideia maravilhosa presentear sua sogra. Para alguém que ama crochê e tem esse perfil delicado, selecionei itens que transmitem carinho e conforto. O que acha desses?",
                "product_ids": ["uuid-1", "uuid-2"]
            }

            Agora é sua vez:
            Mensagem atual do Usuário: "${message}"
            Histórico da conversa: ${JSON.stringify(history || [])}
        `

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    response_mime_type: "application/json",
                }
            })
        })

        const geminiData = await geminiResponse.json()

        if (!geminiResponse.ok) {
            console.error('Gemini Error:', geminiData)
            throw new Error('Ocorreu um soluço na minha inteligência. Pode tentar novamente?')
        }

        const rawText = geminiData.candidates[0].content.parts[0].text
        const aiOutput = JSON.parse(rawText)

        // 4. Fetch the full product data for the suggested IDs to ensure they still exist/are active
        let suggestedProducts = []
        if (aiOutput.product_ids && aiOutput.product_ids.length > 0) {
            const { data: pData } = await supabaseClient
                .from('products')
                .select('id, name, price, images')
                .in('id', aiOutput.product_ids)
                .eq('is_active', true)
            suggestedProducts = pData || []
        }

        return new Response(
            JSON.stringify({
                text: aiOutput.text,
                products: suggestedProducts
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Function error:', error)
        return new Response(
            JSON.stringify({ error: (error as any).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
