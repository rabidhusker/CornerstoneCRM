import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

/**
 * Normalize phone number to E.164 format
 * @param phoneNumber - Phone number in any format
 * @returns Phone number in E.164 format (e.g., +1234567890)
 */
function normalizePhoneNumber(phoneNumber: string | null): string | null {
  if (!phoneNumber) return null
  
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '')
  
  // If it doesn't start with +, add +1 for US numbers
  if (!cleaned.startsWith('+')) {
    // If it starts with 1 and has 11 digits, add +
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = '+' + cleaned
    } else if (cleaned.length === 10) {
      // 10-digit US number, add +1
      cleaned = '+1' + cleaned
    } else {
      // Try to add +1 if it looks like a US number
      cleaned = '+1' + cleaned
    }
  }
  
  return cleaned
}

/**
 * POST /api/test-call/voice-handler
 * TwiML handler for test calls:
 * 1. Handling outgoing calls from the Browser (Softphone)
 * 2. Handling PSTN test calls (initiated via API)
 * 
 * IMPORTANT: This application does NOT place calls to RetellAI or any external AI services.
 * We ONLY dial the callbot's phone_number from the database. The phone number must be
 * a valid Twilio number or a number that can be dialed via Twilio.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const caller = formData.get('Caller') as string
    const to = formData.get('To') as string
    const callSid = formData.get('CallSid') as string

    // Check if the call is coming from a Browser Client (client:identity)
    const isBrowserCall = caller && caller.startsWith('client:')

    const twiml = new twilio.twiml.VoiceResponse()

    // IMPORTANT: This application does NOT place calls to RetellAI.
    // We ONLY use the callbot's phone_number from the database.
    // 
    // The "To" parameter from the browser client is the callbot's phone_number from the database
    // This is passed from the TestCall component: device.connect({ params: { To: fromNumber }})
    // We MUST have the "To" parameter (callbot phone number) - no fallbacks to external services
    const rawTargetNumber = to || null
    
    // Normalize the phone number to E.164 format
    const targetNumber = normalizePhoneNumber(rawTargetNumber)

    // Outbound Caller ID: MUST be a verified Twilio number.
    const callerId = process.env.TWILIO_PHONE_NUMBER
    const normalizedCallerId = normalizePhoneNumber(callerId || null)

    console.log('[Voice Handler] ========== INCOMING CALL ==========')
    console.log('[Voice Handler] Call SID:', callSid)
    console.log('[Voice Handler] Caller:', caller)
    console.log('[Voice Handler] To (raw):', to)
    console.log('[Voice Handler] Is Browser Call:', isBrowserCall)
    console.log('[Voice Handler] Target Number (normalized):', targetNumber)
    console.log('[Voice Handler] Caller ID (raw):', callerId)
    console.log('[Voice Handler] Caller ID (normalized):', normalizedCallerId)
    console.log('[Voice Handler] Caller ID Configured:', !!normalizedCallerId)

    if (!normalizedCallerId) {
      console.error('[Voice Handler] CRITICAL: TWILIO_PHONE_NUMBER is not set or invalid');
      twiml.say("System configuration error. Caller I D is missing.")
      return new NextResponse(twiml.toString(), { status: 200, headers: { 'Content-Type': 'text/xml' } })
    }

    if (!targetNumber) {
      console.error('[Voice Handler] CRITICAL: Callbot phone number is missing or invalid', {
        isBrowserCall,
        rawTo: to,
        normalized: targetNumber
      })
      twiml.say("Error. Callbot phone number not found. Please ensure the callbot has a phone number configured in the database.")
      return new NextResponse(twiml.toString(), { status: 200, headers: { 'Content-Type': 'text/xml' } })
    }

    // At this point, both targetNumber and normalizedCallerId are guaranteed to be strings
    // TypeScript should narrow the types, but we'll use them as strings
    const finalTargetNumber: string = targetNumber
    const finalCallerId: string = normalizedCallerId

    // Validate phone number format (E.164)
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    if (!phoneRegex.test(finalTargetNumber)) {
      console.error('[Voice Handler] CRITICAL: Target number is not in valid E.164 format:', finalTargetNumber);
      twiml.say("Error. Invalid phone number format.")
      return new NextResponse(twiml.toString(), { status: 200, headers: { 'Content-Type': 'text/xml' } })
    }

    if (isBrowserCall) {
      // Browser -> Bot
      console.log('[Voice Handler] Processing browser call to:', finalTargetNumber)
      twiml.say("Connecting to your agent.")
      const dial = twiml.dial({
        callerId: finalCallerId,
        record: 'record-from-answer',
        timeout: 30
      })
      dial.number(finalTargetNumber)
      console.log('[Voice Handler] TwiML generated for browser call')

    } else {
      // PSTN -> Bot (Legacy/Test)
      console.log('[Voice Handler] Processing PSTN call to:', finalTargetNumber)
      twiml.say("Connecting test call.")
      const dial = twiml.dial({
        record: 'record-from-answer',
        timeout: 30
      })
      dial.number(finalTargetNumber)
      console.log('[Voice Handler] TwiML generated for PSTN call')
    }

    const twimlResponse = twiml.toString()
    console.log('[Voice Handler] TwiML Response:', twimlResponse)

    return new NextResponse(twimlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (error) {
    console.error('[Voice Handler] ========== ERROR ==========')
    console.error('[Voice Handler] Error details:', error)
    console.error('[Voice Handler] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    const twiml = new twilio.twiml.VoiceResponse()
    twiml.say('Sorry, there was an application error.')
    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}

