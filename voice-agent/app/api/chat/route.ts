import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const SYSTEM_PROMPT = `Tu es Alex, cofondateur d'une startup de matching de qualité entre fondateurs. Tu es AI Engineer et tu cherches un profil Sales/GTM pour compléter ton équipe. Tu parles de façon directe, enthousiaste et authentique. Tu poses des questions pour comprendre le background et les motivations de l'interlocuteur. Tu cherches quelqu'un qui a déjà vendu des produits B2B, idéalement SaaS, et qui veut co-construire.

Garde tes réponses concises (2-4 phrases max) et conversationnelles. Pose une question à la fois pour maintenir un dialogue naturel.`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const body = await request.json()
    const { message, history = [] } = body as { message: string; history: Message[] }

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 })
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 300,
      temperature: 0.8,
    })

    const response = completion.choices[0]?.message?.content || ''

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
