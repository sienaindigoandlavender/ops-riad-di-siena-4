export interface Booking {
  id: string;
  guestName: string;
  room: string;
  property: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  source: string;
  status: string;
  email?: string;
  phone?: string;
  rowIndex?: number;
  firstName?: string;
  lastName?: string;
  country?: string;
  language?: string;
  notes?: string;
  arrivalTime?: string;
}
