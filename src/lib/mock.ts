export type ProfileStatus = "active" | "found" | "deceased";

export interface MockProfile {
  id: string;
  userId: string;
  name: string;
  photoUrl: string | null;
  lastKnownLocation: string;
  status: ProfileStatus;
  contactPhone: string | null;
  notes: string | null;
  updatedAt: string;
}

export const mockProfiles: MockProfile[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    userId: "user-1",
    name: "María González",
    photoUrl: null,
    lastKnownLocation: "San Juan, PR",
    status: "active",
    contactPhone: "+1 787-555-0101",
    notes: "Last seen near Plaza las Américas wearing a blue jacket.",
    updatedAt: "2h ago",
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    userId: "user-2",
    name: "Martín Rivera",
    photoUrl: null,
    lastKnownLocation: "Mayagüez",
    status: "found",
    contactPhone: "+1 787-555-0102",
    notes: "Reunited with family at the municipal shelter.",
    updatedAt: "1d ago",
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    userId: "user-3",
    name: "Mario Santos",
    photoUrl: null,
    lastKnownLocation: "Ponce",
    status: "deceased",
    contactPhone: null,
    notes: "Identified by authorities; awaiting family contact.",
    updatedAt: "3d ago",
  },
  {
    id: "d4e5f6a7-b8c9-0123-defa-234567890123",
    userId: "user-1",
    name: "Ana Torres",
    photoUrl: null,
    lastKnownLocation: "Caguas",
    status: "active",
    contactPhone: "+1 787-555-0104",
    notes: "Has diabetes; may need insulin.",
    updatedAt: "5h ago",
  },
];

export function findProfileById(id: string): MockProfile | undefined {
  return mockProfiles.find((p) => p.id === id);
}
