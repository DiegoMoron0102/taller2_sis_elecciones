import { NextRequest, NextResponse } from 'next/server';

// Backend API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/api/voto/boletas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response data
    const data = await response.json();

    // Return response with same status
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Error en proxy de boletas:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        mensaje: 'No se pudieron obtener las boletas',
        boletas: []
      },
      { status: 500 }
    );
  }
}
