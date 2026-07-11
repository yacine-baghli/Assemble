'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type AppState = 'idle' | 'recording' | 'processing' | 'speaking'

export default function VoiceAgent() {
  const [state, setState] = useState<AppState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const [statusText, setStatusText] = useState('Cliquez pour parler à Alex')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const playAudio = useCallback(async (audioBuffer: ArrayBuffer) => {
    const audioContext = new AudioContext()
    const decoded = await audioContext.decodeAudioData(audioBuffer)
    const source = audioContext.createBufferSource()
    source.buffer = decoded
    source.connect(audioContext.destination)
    return new Promise<void>((resolve) => {
      source.onended = () => {
        audioContext.close()
        resolve()
      }
      source.start(0)
    })
  }, [])

  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      try {
        setState('processing')
        setStatusText('Transcription en cours...')
        setError(null)

        // Step 1: Transcribe audio
        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.webm')

        const transcribeRes = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        })

        if (!transcribeRes.ok) throw new Error('Transcription failed')
        const { text: userText } = await transcribeRes.json()

        if (!userText?.trim()) {
          setState('idle')
          setStatusText('Aucune voix détectée. Réessayez.')
          return
        }

        const userMessage: Message = { role: 'user', content: userText }
        const updatedHistory = [...messages, userMessage]
        setMessages(updatedHistory)

        // Step 2: Get AI response
        setStatusText('Alex réfléchit...')

        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            history: messages,
          }),
        })

        if (!chatRes.ok) throw new Error('Chat failed')
        const { response: assistantText } = await chatRes.json()

        const assistantMessage: Message = { role: 'assistant', content: assistantText }
        const finalHistory = [...updatedHistory, assistantMessage]
        setMessages(finalHistory)

        // Step 3: Convert to speech
        setState('speaking')
        setStatusText('Alex parle...')

        const speakRes = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: assistantText }),
        })

        if (!speakRes.ok) throw new Error('TTS failed')
        const audioBuffer = await speakRes.arrayBuffer()
        await playAudio(audioBuffer)

        setState('idle')
        setStatusText('Cliquez pour répondre à Alex')
      } catch (err) {
        console.error(err)
        setError('Une erreur est survenue. Vérifiez vos clés API.')
        setState('idle')
        setStatusText('Cliquez pour réessayer')
      }
    },
    [messages, playAudio]
  )

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        stream.getTracks().forEach((track) => track.stop())
        processAudio(audioBlob)
      }

      mediaRecorder.start()
      setState('recording')
      setStatusText('Enregistrement... Cliquez pour arrêter')
    } catch (err) {
      console.error(err)
      setError('Microphone inaccessible. Vérifiez les permissions de votre navigateur.')
    }
  }, [processAudio])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const handleMicClick = useCallback(() => {
    if (state === 'idle') {
      startRecording()
    } else if (state === 'recording') {
      stopRecording()
    }
  }, [state, startRecording, stopRecording])

  const isButtonActive = state === 'idle' || state === 'recording'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-2xl px-6 pt-10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-lg">
            A
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Alex</h1>
            <p className="text-sm text-gray-400">AI Engineer · Co-fondateur · Cherche Sales/GTM</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs text-gray-400">En ligne</span>
          </div>
        </div>
      </header>

      {/* Divider */}
      <div className="w-full max-w-2xl px-6">
        <div className="border-t border-gray-800"></div>
      </div>

      {/* Transcript */}
      <main
        className="w-full max-w-2xl flex-1 px-6 py-6 overflow-y-auto space-y-4"
        style={{ maxHeight: 'calc(100vh - 260px)', minHeight: '300px' }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full pt-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <p className="text-gray-400 text-sm max-w-xs">
              Appuyez sur le bouton micro pour commencer votre conversation avec Alex.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                A
              </div>
            )}
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-gray-800 text-gray-100 rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                V
              </div>
            )}
          </div>
        ))}

        {(state === 'processing' || state === 'speaking') && (
          <div className="flex gap-3 flex-row">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
              A
            </div>
            <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1 items-center h-4">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></span>
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></span>
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></span>
              </div>
            </div>
          </div>
        )}

        <div ref={transcriptEndRef} />
      </main>

      {/* Controls */}
      <footer className="w-full max-w-2xl px-6 pb-10 pt-4">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleMicClick}
            disabled={!isButtonActive}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-950 ${
              state === 'recording'
                ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 scale-110'
                : state === 'idle'
                  ? 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500 hover:scale-105'
                  : 'bg-gray-700 cursor-not-allowed opacity-60'
            }`}
            aria-label={
              state === 'recording' ? "Arrêter l'enregistrement" : "Commencer l'enregistrement"
            }
          >
            {state === 'recording' && (
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40"></span>
            )}
            {state === 'speaking' ? (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
            ) : state === 'recording' ? (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            )}
          </button>

          <p className="text-sm text-gray-400 text-center">{statusText}</p>
        </div>
      </footer>
    </div>
  )
}
