import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { appointmentId, type } = body // type: 'created' | 'reminder'

    const supabase = await createClient()

    // Buscar dados do agendamento com informações completas
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        client:profiles!appointments_client_id_fkey(id, full_name, email, phone),
        staff:profiles!appointments_staff_id_fkey(id, full_name, email, phone),
        service:services(name, duration, price)
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
    }

    const appointmentDate = new Date(appointment.appointment_date)
    const formattedDate = appointmentDate.toLocaleDateString('pt-BR')
    const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    let emailSubject = ''
    let emailBody = ''
    let smsMessage = ''

    if (type === 'created') {
      emailSubject = '✨ Agendamento Confirmado - Stylus Estética e Beleza'
      emailBody = `
        <h2>Olá ${appointment.client?.full_name || appointment.sporadic_client_name}!</h2>
        <p>Seu agendamento foi confirmado com sucesso! 🎉</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Detalhes do Agendamento:</h3>
          <p><strong>📅 Data:</strong> ${formattedDate}</p>
          <p><strong>⏰ Horário:</strong> ${formattedTime}</p>
          <p><strong>💇 Serviço:</strong> ${appointment.service?.name || 'A definir'}</p>
          <p><strong>👤 Profissional:</strong> ${appointment.staff?.full_name}</p>
          ${appointment.service?.duration ? `<p><strong>⏱️ Duração:</strong> ${appointment.service.duration} minutos</p>` : ''}
          ${appointment.service?.price ? `<p><strong>💰 Valor:</strong> R$ ${appointment.service.price.toFixed(2)}</p>` : ''}
        </div>
        <p>Estamos ansiosos para atendê-lo(a)!</p>
        <p><em>Stylus Estética e Beleza - Sua Beleza, Nossa Paixão</em></p>
      `
      smsMessage = `Stylus: Agendamento confirmado! ${formattedDate} às ${formattedTime} com ${appointment.staff?.full_name}. Serviço: ${appointment.service?.name || 'A definir'}.`
    } else if (type === 'reminder') {
      emailSubject = '⏰ Lembrete: Seu agendamento é em 1 hora!'
      emailBody = `
        <h2>Olá ${appointment.client?.full_name || appointment.sporadic_client_name}!</h2>
        <p>Este é um lembrete de que seu agendamento é daqui a 1 hora! ⏰</p>
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>Detalhes do Agendamento:</h3>
          <p><strong>⏰ Horário:</strong> ${formattedTime}</p>
          <p><strong>💇 Serviço:</strong> ${appointment.service?.name || 'A definir'}</p>
          <p><strong>👤 Profissional:</strong> ${appointment.staff?.full_name}</p>
        </div>
        <p>Nos vemos em breve! 😊</p>
        <p><em>Stylus Estética e Beleza</em></p>
      `
      smsMessage = `Stylus: Lembrete! Seu agendamento é às ${formattedTime} (em 1 hora) com ${appointment.staff?.full_name}. Te esperamos!`
    }

    // Enviar notificações
    const notifications = []

    // Email para cliente (se tiver email cadastrado)
    if (appointment.client?.email) {
      notifications.push(
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Stylus <noreply@stylus.com>',
            to: appointment.client.email,
            subject: emailSubject,
            html: emailBody,
          }),
        })
      )
    }

    // Email para staff (no caso de lembrete)
    if (type === 'reminder' && appointment.staff?.email) {
      const staffEmailBody = `
        <h2>Olá ${appointment.staff.full_name}!</h2>
        <p>Lembrete: Você tem um agendamento em 1 hora! ⏰</p>
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
          <h3>Detalhes do Agendamento:</h3>
          <p><strong>⏰ Horário:</strong> ${formattedTime}</p>
          <p><strong>👤 Cliente:</strong> ${appointment.client?.full_name || appointment.sporadic_client_name}</p>
          <p><strong>💇 Serviço:</strong> ${appointment.service?.name || 'A definir'}</p>
          ${appointment.notes ? `<p><strong>📝 Observações:</strong> ${appointment.notes}</p>` : ''}
        </div>
        <p><em>Stylus Estética e Beleza</em></p>
      `
      notifications.push(
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Stylus <noreply@stylus.com>',
            to: appointment.staff.email,
            subject: '⏰ Lembrete: Agendamento em 1 hora',
            html: staffEmailBody,
          }),
        })
      )
    }

    // SMS via Twilio (se configurado e houver telefone)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      const twilioPhone = appointment.client?.phone || appointment.sporadic_client_phone
      if (twilioPhone) {
        notifications.push(
          fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(
                  `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
                ).toString('base64')}`,
              },
              body: new URLSearchParams({
                From: process.env.TWILIO_PHONE_NUMBER,
                To: twilioPhone,
                Body: smsMessage,
              }),
            }
          )
        )
      }
    }

    await Promise.allSettled(notifications)

    return NextResponse.json({ success: true, message: 'Notificações enviadas' })
  } catch (error) {
    console.error('[v0] Erro ao enviar notificações:', error)
    return NextResponse.json({ error: 'Erro ao enviar notificações' }, { status: 500 })
  }
}
