import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, email, telefono, mensaje } = body

    if (!nombre || !mensaje) {
      return NextResponse.json({ error: 'Nombre y mensaje requeridos' }, { status: 400 })
    }

    if (process.env.ZOHO_EMAIL && process.env.ZOHO_PASSWORD) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.zoho.com',
        port: 465,
        secure: true,
        auth: { user: process.env.ZOHO_EMAIL, pass: process.env.ZOHO_PASSWORD },
      })

      await transporter.sendMail({
        from: `"Carnicería El Fundo" <${process.env.ZOHO_EMAIL}>`,
        to: 'contacto@carniceriaelfundo.cl',
        replyTo: email || undefined,
        subject: `Mensaje de contacto de ${nombre}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#dc2626">Nuevo mensaje de contacto</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;font-weight:bold;color:#374151;width:120px">Nombre</td><td style="padding:8px">${nombre}</td></tr>
              ${email ? `<tr><td style="padding:8px;font-weight:bold;color:#374151">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>` : ''}
              ${telefono ? `<tr><td style="padding:8px;font-weight:bold;color:#374151">Teléfono</td><td style="padding:8px">${telefono}</td></tr>` : ''}
              <tr><td style="padding:8px;font-weight:bold;color:#374151;vertical-align:top">Mensaje</td><td style="padding:8px;white-space:pre-wrap">${mensaje}</td></tr>
            </table>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">Formulario de contacto · carniceriaelfundo.cl</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact form error:', err)
    return NextResponse.json({ ok: true })
  }
}
