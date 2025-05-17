export interface Event {
  id: number;
  name: string;
  host: string;
  category: string;
  description: string;
  start_date: Date;
  end_date: Date;
  event_type?: 'volunteer' | 'donation' | 'teaching' | 'mixed';
  donation_goal?: number;
  donation_goal_description?: string;
  is_active?: boolean;
  created_at?: Date;
}

export interface EventInput {
  name: string;
  host: string;
  category: string;
  description: string;
  start_date: string;
  end_date: string;
  event_type?: string;
  donation_goal?: number;
  donation_goal_description?: string;
  is_active?: boolean;
}

// User interfaces
// Update the User interface to include role
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'member';
  created_at?: Date;
}

export interface UserInput {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: 'admin' | 'member';
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface EventRegistration {
  id: number;
  user_id: number;
  event_id: number;
  registration_date: Date;
}

export interface EventRegistrationInput {
  event_id: number;
}

// New interfaces for event roles
export interface EventRole {
  id: number;
  event_id: number;
  name: string;
  description: string;
  capacity: number;
  skills_required?: string;
  created_at?: Date;
}

export interface EventRoleInput {
  name: string;
  description?: string;
  capacity: number;
  skills_required?: string;
}

// New interfaces for role registrations
export interface RoleRegistration {
  id: number;
  user_id: number;
  event_id: number;
  role_id: number;
  status: 'pending' | 'approved' | 'declined' | 'completed';
  registration_date: Date;
}

export interface RoleRegistrationInput {
  event_id: number;
  role_id: number;
}

// New interfaces for donations
export interface DonationType {
  id: number;
  name: string;
  description?: string;
  unit_of_measure?: string;
}

export interface Donation {
  id: number;
  event_id: number;
  user_id?: number;
  donation_type_id: number;
  amount?: number;
  quantity?: number;
  item_description?: string;
  status: 'pending' | 'received' | 'distributed';
  donation_date: Date;
}

export interface DonationInput {
  event_id: number;
  user_id?: number;
  donation_type_id: number;
  amount?: number;
  quantity?: number;
  item_description?: string;
}

// New interfaces for donation summary
export interface DonationSummary {
  type: string;
  unit_of_measure?: string;
  total_amount: number;
  total_quantity: number;
  donation_count: number;
}

export interface EventDonations {
  donations: Donation[];
  summary: DonationSummary[];
}