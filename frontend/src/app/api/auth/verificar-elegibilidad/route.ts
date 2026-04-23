import { NextRequest, NextResponse } from 'next/server';

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    // Obtener datos del request
    const body = await request.json();
    
    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/api/auth/verificar-elegibilidad`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Get response data
    const data = await response.json();

    // Return response with same status
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Error en proxy de verificación:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        mensaje: 'No se pudo procesar la solicitud de verificación'
      },
      { status: 500 }
    );
  }
}
