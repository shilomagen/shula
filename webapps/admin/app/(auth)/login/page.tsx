'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import he from '@/locales/he';
import { AuthError } from 'next-auth';
import Image from 'next/image';
import { useState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      await login(formData);
    } catch (error) {
      if ((error as AuthError).name === 'CredentialsSignin') {
        setError(he.auth.login.errors.invalidCredentials);
      } else {
        setError(he.auth.login.errors.generalError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-32 h-32 relative mb- ">
            <Image
              src="/shula.png"
              alt="Shula Logo"
              fill
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold">
            {he.auth.login.title}
          </CardTitle>
          <CardDescription>{he.auth.login.description}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{he.auth.login.emailLabel}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={he.auth.login.emailPlaceholder}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{he.auth.login.passwordLabel}</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? he.auth.login.loggingIn : he.auth.login.submitButton}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
