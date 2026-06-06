import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

function createTransport() {
  return nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_PASSWORD,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, empresa, telefono, email, mensaje } = body

    if (!email || !nombre) {
      return NextResponse.json({ error: 'Nombre y email requeridos' }, { status: 400 })
    }

    // Guardar en Supabase
    const { error } = await getSupabase()
      .from('supplier_contacts')
      .insert({ nombre, empresa: empresa || '', telefono: telefono || '', email, mensaje: mensaje || '' })

    if (error) {
      console.error('Supplier contact error (table may not exist yet):', error.message)
    }

    // Enviar notificación por email si las credenciales están configuradas
    if (process.env.ZOHO_EMAIL && process.env.ZOHO_PASSWORD) {
      try {
        const transporter = createTransport()
        await transporter.sendMail({
          from: `"Carnicería El Fundo" <${process.env.ZOHO_EMAIL}>`,
          to: process.env.ZOHO_EMAIL,
          replyTo: email,
          subject: `Consulta mayorista de ${nombre}${empresa ? ` (${empresa})` : ''}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#dc2626">Nueva consulta mayorista</h2>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px;font-weight:bold;color:#374151">Nombre</td><td style="padding:8px">${nombre}</td></tr>
                ${empresa ? `<tr><td style="padding:8px;font-weight:bold;color:#374151">Empresa</td><td style="padding:8px">${empresa}</td></tr>` : ''}
                ${telefono ? `<tr><td style="padding:8px;font-weight:bold;color:#374151">Teléfono</td><td style="padding:8px">${telefono}</td></tr>` : ''}
                <tr><td style="padding:8px;font-weight:bold;color:#374151">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
                ${mensaje ? `<tr><td style="padding:8px;font-weight:bold;color:#374151;vertical-align:top">Mensaje</td><td style="padding:8px">${mensaje}</td></tr>` : ''}
              </table>
              <p style="color:#6b7280;font-size:12px;margin-top:24px">Formulario mayoristas · carniceriaelfundo.cl</p>
            </div>
          `,
        })
      } catch (mailErr) {
        console.error('Email send error:', mailErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Supplier contact exception:', err)
    return NextResponse.json({ ok: true })
  }
}
