'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Boleta {
  id: number;
  votoCifrado: string;
  pruebaZK: string;
  nullifier: string;
  bloque: number;
}

interface Estadisticas {
  totalVotos: number;
  elegiblesCount: number;
  usadosCount: number;
  disponibles: number;
  eleccionAbierta: boolean;
}

export default function Explorer() {
  const [boletas, setBoletas] = useState<Boleta[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener boletas
        const boletasResponse = await fetch('/api/voto/boletas');
        if (!boletasResponse.ok) {
          throw new Error('Error al obtener boletas');
        }
        const boletasData = await boletasResponse.json();
        setBoletas(boletasData.boletas || []);

        // Obtener estadísticas
        const statsResponse = await fetch('/api/voto/estadisticas');
        if (!statsResponse.ok) {
          throw new Error('Error al obtener estadísticas');
        }
        const statsData = await statsResponse.json();
        setEstadisticas(statsData.estadisticas || statsData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTxHash = (hash: string) => {
    return hash.substring(0, 10) + '...' + hash.substring(hash.length - 8);
  };

  const formatNullifier = (nullifier: string) => {
    return nullifier.substring(0, 8) + '...' + nullifier.substring(nullifier.length - 8);
  };

  const formatVotoCifrado = (votoCifrado: string) => {
    return votoCifrado.substring(0, 12) + '...' + votoCifrado.substring(votoCifrado.length - 12);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando datos de blockchain...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Explorador Blockchain</h1>
          <p className="mt-2 text-sm text-gray-600">Visualización de votos almacenados en blockchain</p>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.totalVotos}</div>
              <div className="text-sm text-gray-600">Total Votos</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-green-600">{estadisticas.elegiblesCount}</div>
              <div className="text-sm text-gray-600">Elegibles</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-orange-600">{estadisticas.usadosCount}</div>
              <div className="text-sm text-gray-600">Usados</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-purple-600">{estadisticas.disponibles}</div>
              <div className="text-sm text-gray-600">Disponibles</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className={`text-2xl font-bold ${estadisticas.eleccionAbierta ? 'text-green-600' : 'text-red-600'}`}>
                {estadisticas.eleccionAbierta ? 'Abierta' : 'Cerrada'}
              </div>
              <div className="text-sm text-gray-600">Elección</div>
            </div>
          </div>
        )}

        {/* Tabla de Boletas */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Boletas Registradas</h2>
            <p className="text-sm text-gray-600">Votos almacenados en blockchain</p>
          </div>
          
          {boletas.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay boletas registradas</h3>
              <p className="text-gray-600">Los votos aparecerán aquí cuando se emitan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voto Cifrado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prueba ZK
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nullifier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bloque
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {boletas.map((boleta) => (
                    <tr key={boleta.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{boleta.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {formatVotoCifrado(boleta.votoCifrado)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {formatVotoCifrado(boleta.pruebaZK)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {formatNullifier(boleta.nullifier)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {boleta.bloque}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Información de Contratos */}
        <div className="mt-8 bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Direcciones de Contratos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm font-medium text-gray-700">BulletinBoard</div>
              <div className="font-mono text-xs text-gray-600 mt-1">0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm font-medium text-gray-700">NullifierSet</div>
              <div className="font-mono text-xs text-gray-600 mt-1">0xa513E6E4b8f2a923D98304ec87F64353C4D5C853</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm font-medium text-gray-700">AdminParams</div>
              <div className="font-mono text-xs text-gray-600 mt-1">0x0165878A594ca255338adfa4d48449f69242Eb8F</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm font-medium text-gray-700">Escrutinio</div>
              <div className="font-mono text-xs text-gray-600 mt-1">0x8A791620dd6260079BF849Dc5567aDC3F2FdC318</div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-8 flex space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Actualizar Datos
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
