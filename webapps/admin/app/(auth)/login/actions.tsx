'use server';

import { signIn } from '@/auth';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  // Use the server-side signIn function
  return await signIn('credentials', {
    email,
    password,
    redirect: true,
    redirectTo: '/dashboard',
  });
}
