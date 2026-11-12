// Sends the OTP SMS. OTP_MODE=console (default) prints it in the server terminal for testing.
// OTP_MODE=twilio sends a real SMS using your Twilio keys (see .env.example).
export async function sendOtp(phone, code) {
  const mode = process.env.OTP_MODE || 'console'
  const text = `Your ${process.env.STORE_NAME || 'PoultryPro'} verification code is ${code}. It is valid for 5 minutes.`

  if (mode === 'twilio') {
    const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: from } = process.env
    if (!sid || !token || !from) throw new Error('Twilio keys are missing in .env')
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: '+' + phone, From: from, Body: text }),
    })
    if (!res.ok) throw new Error('Twilio error ' + res.status + ' ' + (await res.text()))
    return
  }
  console.log(`[OTP] +${phone} -> ${code}`)
}
