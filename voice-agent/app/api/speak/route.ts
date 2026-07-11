import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body as { text: string }

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID
    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!voiceId || !apiKey) {
      return NextResponse.json({ error: 'ElevenLabs configuration missing' }, { status: 500 })
    }

    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text()
      console.error('ElevenLabs error:', errorText)
      return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 })
    }

    const audioBuffer = await elevenLabsResponse.arrayBuffer()

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('Speak error:', error)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
