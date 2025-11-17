import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Buscar agendamentos que começam em 1 hora (com margem de 5 minutos)
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
    const oneHourAndFiveMinutesFromNow = new Date(now.getTime() + 65 * 60 * 1000)

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id')
      .gte('appointment_date', oneHourFromNow.toISOString())
      .lte('appointment_date', oneHourAndFiveMinutesFromNow.toISOString())
      .in('status', ['confirmed', 'pending'])
      .is('reminder_sent', false)

    if (error) throw error

    // Enviar lembretes para cada agendamento
    const reminderPromises = (appointments || []).map(async (appointment) => {
      try {
        await fetch(`${process.env.NEXTAUTH_URL}/api/send-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: appointment.id,
            type: 'reminder'
          })
        })

        // Marcar lembrete como enviado
        await supabase
          .from('appointments')
          .update({ reminder_sent: true })
          .eq('id', appointment.id)
      } catch (err) {
        console.error(`[v0] Erro ao enviar lembrete para appointment ${appointment.id}:`, err)
      }
    })

    await Promise.allSettled(reminderPromises)

    return NextResponse.json({ 
      success: true, 
      reminders_sent: appointments?.length || 0 
    })
  } catch (error) {
    console.error('[v0] Erro ao verificar lembretes:', error)
    return NextResponse.json({ error: 'Erro ao verificar lembretes' }, { status: 500 })
  }
}
