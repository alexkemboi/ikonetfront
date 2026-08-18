'use server';

import { revalidateTag } from 'next/cache';
import {
  HotspotPackagesResponse,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  ReconnectResponse,
} from '@/lib/types/hotspot';
import { BASE_URL, buildApiUrl } from '@/lib/constants';
import { auth } from '@/lib/auth';

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  return headers;
}


export async function getHotspotPackages(): Promise<HotspotPackagesResponse> {
  try {
    console.log(`${BASE_URL}system/packages`)
    const response = await fetch(`${BASE_URL}system/packages`, {
      headers: await getAuthHeaders(),
      next: {
        tags: ['hotspot-packages'],
        revalidate: 3600, // Revalidate every hour
      },
    });

    

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch hotspot packages');
    }

    const data = await response.json()

    console.log(data)

    return data;
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
    console.log(`${BASE_URL}hotspot/initiate` );
    const response = await fetch(`${BASE_URL}hotspot/initiate`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(requestBody),
    });

    console.log('Initiate Payment Request:', requestBody);
    console.log('Initiate Payment Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to initiate payment');
    }

    revalidateTag('hotspot-packages', 'page'); // Revalidate packages after payment
    const paymentData = await response.json();
    return paymentData;
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: (error as Error).message || 'Internal server error',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function activateVoucherAction(code: string) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}hotspot/activate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ voucherCode: code }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.message || `Voucher activation failed with status ${res.status}`);
    }

    revalidateTag("hotspot", "page");
    return await res.json();
  } catch (error) {
    console.error("[Hotspot Action] activateVoucherAction error:", error);
    return {
      status: 500,
      success: false,
      message: (error as Error).message,
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
      `${buildApiUrl("/hotspot/reconnect")}?mac=${macAddress}&ip=${ipAddress}`,
      {
        next: {
          tags: ['hotspot-session'],
          revalidate: 60, // Revalidate every minute for session status
        },
        headers: await getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to check active session');
    }

    const sessionData = await response.json();
    return sessionData;
  } catch (error) {
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
