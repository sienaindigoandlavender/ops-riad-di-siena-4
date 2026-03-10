import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("order", { ascending: true });

    if (error) throw error;

    const processed = (data || []).map((room: any) => ({
      Room_ID: room.room_id || "",
      Name: room.name || "",
      Description: room.description || "",
      Price_EUR: room.price_eur || "",
      Image_URL: room.image_url || "",
      iCal_URL: room.ical_url || "",
      Order: room.order || 0,
      Bookable: room.bookable ? "Yes" : "No",
      features: room.features ? room.features.split(",").map((f: string) => f.trim()) : [],
    }));

    return NextResponse.json(processed);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json([], { status: 500 });
  }
}
