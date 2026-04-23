'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CredencialForm {
  numeroPadron: string;
  nombre: string;
  ci: string;
}

interface TokenResponse {
  token: string;
  sessionId: string;
  expiresIn: number;
}

export default function VerificarElegibilidad() {
  const router = useRouter();
  const [formData, setFormData] = useState<CredencialForm>({
    numeroPadron: '',
    nombre: '',
    ci: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validar formato de datos
      if (!formData.numeroPadron || !formData.nombre || !formData.ci) {
        setError('Todos los campos son obligatorios');
        return;
      }

      // Formato esperado: LP123456
      const padronRegex = /^[A-Z]{2}\d{6}$/;
      if (!padronRegex.test(formData.numeroPadron.toUpperCase())) {
        setError('El número de padrón debe tener formato: 2 letras + 6 números (ej: LP123456)');
        return;
      }

      // Formato CI boliviano
      const ciRegex = /^\d{7,8}[A-Z]?$/;
      if (!ciRegex.test(formData.ci.toUpperCase())) {
        setError('El CI debe tener 7-8 dígitos seguidos de una letra opcional (ej: 12345678L)');
        return;
      }

      // Enviar credencial para verificación
      const response = await fetch('/api/auth/verificar-elegibilidad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          numeroPadron: formData.numeroPadron.toUpperCase(),
          ci: formData.ci.toUpperCase()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al verificar credencial');
      }

      setTokenData(data);
      
      // Guardar token en localStorage
      localStorage.setItem('votingToken', data.token);
      localStorage.setItem('sessionId', data.sessionId);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinuar = () => {
    if (tokenData) {
      router.push('/votar');
    }
  };

  const formatToken = (token: string) => {
    return token.substring(0, 8) + '...' + token.substring(token.length - 8);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Verificar Elegibilidad</h1>
          <p className="mt-2 text-sm text-gray-600">
            Ingrese sus datos para verificar si puede participar en la elección
          </p>
        </div>

        {/* Card */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          {!tokenData ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Número de Padrón */}
              <div>
                <label htmlFor="numeroPadron" className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Padrón
                </label>
                <input
                  type="text"
                  id="numeroPadron"
                  name="numeroPadron"
                  value={formData.numeroPadron}
                  onChange={handleInputChange}
                  placeholder="Ej: LP123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">Formato: 2 letras + 6 números</p>
              </div>

              {/* Nombre Completo */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Juan Pérez García"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              {/* CI */}
              <div>
                <label htmlFor="ci" className="block text-sm font-medium text-gray-700 mb-2">
                  Cédula de Identidad
                </label>
                <input
                  type="text"
                  id="ci"
                  name="ci"
                  value={formData.ci}
                  onChange={handleInputChange}
                  placeholder="Ej: 12345678L"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">7-8 dígitos + letra opcional</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verificando...
                  </div>
                ) : (
                  'Verificar Elegibilidad'
                )}
              </button>
            </form>
          ) : (
            // Success State
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900">¡Elegibilidad Verificada!</h2>
                <p className="mt-2 text-gray-600">
                  Su credencial ha sido validada exitosamente.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Token de Acceso:</p>
                <div className="bg-white border border-gray-200 rounded p-3 font-mono text-sm">
                  {formatToken(tokenData.token)}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Este token es válido por {tokenData.expiresIn / 60} minutos
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      Guarde este token de forma segura. Lo necesitará para emitir su voto.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleContinuar}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continuar al Votar
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Sistema de Votación Descentralizada - Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
