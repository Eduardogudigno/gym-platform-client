export type Role = 'admin' | 'staff' | 'member';

export type User = {
  id: string;
  email: string;
  role: Role;
  status: string;
  firstName: string;
  lastName: string;
  phone: string | null;
};

export type Member = {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: 'active' | 'inactive' | 'suspended';
};

export type PlanDuration = 'monthly' | 'quarterly' | 'yearly';

export type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  duration: PlanDuration;
  benefits: string[];
  isActive: boolean;
};

export type Subscription = {
  id: string;
  memberId: string;
  planId: string;
  status: string;
  priceAmount: string;
  currency: string;
};

export type ExpiringSubscription = {
  subscriptionId: string;
  memberId: string;
  endDate: string | null;
  email: string;
  firstName: string;
  lastName: string;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: User;
  member: Member | null;
};

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
