import { PoolConnection } from 'mariadb';

export type UserTypes = {
  id: number;
  full_name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  created_at: Date;
};

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface SignupRequest {
  email: string;
  password?: string;
  confirm_password?: string;
  full_name: string;
  phone?: string;
  role: string;
}

export interface RestaurantRegisterRequest {
  name: string;
  address: string;
  coordinate: string;
  hotline: string;
  description?: string;
  menu_image: RequestImageType[];
  restaurant_image: RequestImageType[];
  tables: TablesRegisterRequest;
}

type RequestImageType = {
  public_id: string;
  url: string;
};

export type TablesRegisterRequest = {
  tables2?: number;
  tables4?: number;
  tables6?: number;
};

export interface RegisterRestaurant extends RestaurantRegisterRequest {
  userId: number;
  conn: PoolConnection;
}
