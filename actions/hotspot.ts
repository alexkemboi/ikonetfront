'use server';

import { revalidateTag } from 'next/cache';
import {
  HotspotPackagesResponse,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  ReconnectResponse,
} from '@/lib/types/hotspot';

const BASE_URL = 'http://184.168.21.114/api/v1/hotspot';

export async function getHotspotPackages(): Promise<HotspotPackagesResponse> {
  try {
    const response = await fetch(`${BASE_URL}/packages`, {
      next: {
        tags: ['hotspot-packages'],
        revalidate: 3600, // Revalidate every hour
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch hotspot packages');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching hotspot packages:', error);
    return {
      status: 500,
      success: false,
      message: (error as Error).message || 'Internal server error',
      data: [],
      timestamp: new Date().toISOString(),
    };
  }
}

export async function initiateHotspotPayment(
  requestBody: InitiatePaymentRequest
): Promise<InitiatePaymentResponse> {
  try {
    console.log('Initiate Payment Request:', requestBody);
    const response = await fetch(`${BASE_URL}/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Initiate Payment Request:', requestBody);
    console.log('Initiate Payment Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to initiate payment');
    }

    revalidateTag('hotspot-packages', 
      "max"
    ); // Revalidate packages after payment
    return response.json();
  } catch (error) {
    console.error('Error initiating hotspot payment:', error);
    return {
      status: 500,
      success: false,
      message: (error as Error).message || 'Internal server error',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function checkActiveSession(
  macAddress: string,
  ipAddress: string
): Promise<ReconnectResponse> {
  try {
    const response = await fetch(
      `${BASE_URL}/reconnect?mac=${macAddress}&ip=${ipAddress}`,
      {
        next: {
          tags: ['hotspot-session'],
          revalidate: 60, // Revalidate every minute for session status
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to check active session');
    }

    return response.json();
  } catch (error) {
    console.error('Error checking active session:', error);
    return {
      status: 500,
      success: false,
      message: (error as Error).message || 'Internal server error',
      data: {
        hasActiveSession: false,
        message: (error as Error).message || 'Internal server error',
        session: null,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
