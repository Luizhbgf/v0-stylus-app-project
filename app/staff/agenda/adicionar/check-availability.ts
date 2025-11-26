import { createClient } from "@/lib/supabase/client"

export async function checkTimeSlotAvailability(
  staffId: string,
  appointmentDate: string,
): Promise<{ available: boolean; conflictingAppointment?: any }> {
  const supabase = createClient()

  // Check if there's already an appointment at this exact time for this staff
  const { data: existingAppointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("staff_id", staffId)
    .eq("appointment_date", appointmentDate)
    .neq("status", "cancelled")

  if (error) {
    console.error("Error checking availability:", error)
    return { available: false }
  }

  if (existingAppointments && existingAppointments.length > 0) {
    return {
      available: false,
      conflictingAppointment: existingAppointments[0],
    }
  }

  return { available: true }
}
