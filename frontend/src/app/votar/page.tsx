'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Candidato {
  id: number;
  nombre: string;
  partido: string;
  numero: number;
  imagen?: string;
}

interface VotoData {
  candidatoId: number;
  token: string;
}

export default function Votar() {
  const router = useRouter();
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [selectedCandidato, setSelectedCandidato] = useState<number | null>(null);
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [votoEmitido, setVotoEmitido] = useState<any>(null);
  const [eleccionAbierta, setEleccionAbierta] = useState(true);

  // Cargar token del localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('votingToken');
    if (savedToken) {
      setToken(savedToken);
    } else {
      router.push('/verificar');
    }
  }, [router]);

  // Cargar candidatos
  useEffect(() => {
    const candidatosMock: Candidato[] = [
      { id: 0, nombre: 'Juan Pérez', partido: 'Partido Progresista', numero: 1 },
      { id: 1, nombre: 'María García', partido: 'Alianza Nacional', numero: 2 },
      { id: 2, nombre: 'Carlos Ruiz', partido: 'Frente Amplio', numero: 3 },
      { id: 3, nombre: 'Elena Soto', partido: 'Unión Civil', numero: 4 },
      { id: 4, nombre: 'Voto en Blanco', partido: 'N/A', numero: 5 }
    ];
    setCandidatos(candidatosMock);
  }, []);

  // Verificar estado de la elección
  useEffect(() => {
    const verificarEstado = async () => {
      try {
        const response = await fetch('/api/voto/estado-eleccion', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        setEleccionAbierta(data.eleccionAbierta);
      } catch (error) {
        console.error('Error verificando estado:', error);
      }
    };
    verificarEstado();
  }, []);

  const handleCandidatoSelect = (candidatoId: number) => {
    setSelectedCandidato(candidatoId);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (selectedCandidato === null) {
        setError('Debe seleccionar un candidato');
        return;
      }

      if (!token) {
        setError('No hay token de votación válido');
        return;
      }

      const votoData: VotoData = {
        candidatoId: selectedCandidato,
        token
      };

      const response = await fetch('/api/voto/emitir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(votoData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al emitir voto');
      }

      setVotoEmitido(data);
      setSuccess(true);
      
      // Limpiar token después de votar
      localStorage.removeItem('votingToken');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTxHash = (hash: string) => {
    return hash.substring(0, 10) + '...' + hash.substring(hash.length - 8);
  };

  const formatNullifier = (nullifier: string) => {
    return nullifier.substring(0, 8) + '...' + nullifier.substring(nullifier.length - 8);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Token Requerido</h2>
            <p className="text-gray-600 mb-4">Debe verificar su elegibilidad antes de votar</p>
            <button
              onClick={() => router.push('/verificar')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Verificar Elegibilidad
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!eleccionAbierta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Elección Cerrada</h2>
            <p className="text-gray-600">La elección no está abierta para votar en este momento</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900">¡Voto Emitido!</h2>
                <p className="mt-2 text-gray-600">Su voto ha sido registrado exitosamente en la blockchain</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-3">Detalles de la Transacción:</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Hash TX:</span>
                    <div className="font-mono bg-white p-2 rounded border mt-1">
                      {formatTxHash(votoEmitido.transaccion.hash)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Bloque:</span>
                    <div className="bg-white p-2 rounded border mt-1">
                      #{votoEmitido.transaccion.bloque}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Nullifier:</span>
                    <div className="font-mono bg-white p-2 rounded border mt-1">
                      {formatNullifier(votoEmitido.boleta.nullifier)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Timestamp:</span>
                    <div className="bg-white p-2 rounded border mt-1">
                      {new Date(votoEmitido.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
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
                      Guarde estos datos de forma segura. Puede usarlos para verificar su voto más tarde.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Boleta Electrónica</h1>
          <p className="mt-2 text-sm text-gray-600">Seleccione su candidato para emitir su voto</p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <span className="ml-2 text-sm font-medium text-gray-900">Verificar</span>
            </div>
            <div className="w-8 h-0.5 bg-green-500"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <span className="ml-2 text-sm font-medium text-gray-900">Votar</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <span className="ml-2 text-sm text-gray-500">Verificar</span>
            </div>
          </div>
        </div>

        {/* Alerta de Seguridad */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                Su voto es <strong>anónimo y secreto</strong>. Una vez emitido, no podrá ser modificado.
              </p>
            </div>
          </div>
        </div>

        {/* Grid de Candidatos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {candidatos.map((candidato) => (
            <div
              key={candidato.id}
              onClick={() => handleCandidatoSelect(candidato.id)}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedCandidato === candidato.id
                  ? 'ring-4 ring-blue-500 border-blue-500'
                  : 'border-gray-200'
              } border-2`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-700">{candidato.numero}</span>
                </div>
                {selectedCandidato === candidato.id && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{candidato.nombre}</h3>
              <p className="text-sm text-gray-600">{candidato.partido}</p>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
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

        {/* Botones de Acción */}
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/verificar')}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || selectedCandidato === null}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Emitiendo Voto...
              </div>
            ) : (
              'Emitir Voto'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
